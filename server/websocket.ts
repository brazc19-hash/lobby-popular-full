import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { getDb } from "./db";
import {
  channelMessages,
  directMessages,
  communityChannels,
  communityMembers,
  users,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Track online users: userId -> Set of socket IDs
const onlineUsers = new Map<number, Set<string>>();

export function initWebSocket(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"], credentials: true },
    path: "/ws",
  });

  io.on("connection", (socket: Socket) => {
    let currentUserId: number | null = null;

    // ── Authenticate ──────────────────────────────────────────────────────────
    socket.on("authenticate", async (data: { userId: number }) => {
      try {
        const db = await getDb();
        if (!db) { socket.emit("auth_error", { message: "DB indisponível" }); return; }

        const [user] = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.id, data.userId))
          .limit(1);

        if (!user) { socket.emit("auth_error", { message: "Usuário não encontrado" }); return; }

        currentUserId = data.userId;
        if (!onlineUsers.has(currentUserId)) onlineUsers.set(currentUserId, new Set());
        onlineUsers.get(currentUserId)!.add(socket.id);

        socket.emit("authenticated", { userId: currentUserId, name: user.name });
        io.emit("user_online", { userId: currentUserId });
      } catch {
        socket.emit("auth_error", { message: "Erro de autenticação" });
      }
    });

    // ── Join channel ──────────────────────────────────────────────────────────
    socket.on("join_channel", async (data: { channelId: number; communityId: number }) => {
      if (!currentUserId) return;
      const db = await getDb();
      if (!db) return;

      const [membership] = await db
        .select({ id: communityMembers.id })
        .from(communityMembers)
        .where(and(
          eq(communityMembers.communityId, data.communityId),
          eq(communityMembers.userId, currentUserId),
        ))
        .limit(1);

      if (!membership) {
        socket.emit("channel_error", { message: "Você não é membro desta comunidade" });
        return;
      }

      socket.join(`channel:${data.channelId}`);
      socket.emit("channel_joined", { channelId: data.channelId });
    });

    // ── Leave channel ─────────────────────────────────────────────────────────
    socket.on("leave_channel", (data: { channelId: number }) => {
      socket.leave(`channel:${data.channelId}`);
    });

    // ── Send channel message ──────────────────────────────────────────────────
    socket.on("channel_message", async (data: {
      channelId: number;
      content: string;
      mentions?: number[];
      replyToId?: number;
    }) => {
      if (!currentUserId) { socket.emit("message_error", { message: "Não autenticado" }); return; }
      if (!data.content?.trim()) { socket.emit("message_error", { message: "Mensagem vazia" }); return; }

      try {
        const db = await getDb();
        if (!db) { socket.emit("message_error", { message: "DB indisponível" }); return; }

        const [channel] = await db
          .select({ id: communityChannels.id })
          .from(communityChannels)
          .where(eq(communityChannels.id, data.channelId))
          .limit(1);

        if (!channel) { socket.emit("message_error", { message: "Canal não encontrado" }); return; }

        const result = await db.insert(channelMessages).values({
          channelId: data.channelId,
          userId: currentUserId,
          content: data.content.trim(),
          mentions: data.mentions ? JSON.stringify(data.mentions) : null,
          replyToId: data.replyToId ?? null,
        });

        const [sender] = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.id, currentUserId))
          .limit(1);

        const msgPayload = {
          id: (result as unknown as { insertId: number }).insertId,
          channelId: data.channelId,
          userId: currentUserId,
          userName: sender?.name ?? "Usuário",
          content: data.content.trim(),
          mentions: data.mentions ?? [],
          replyToId: data.replyToId ?? null,
          createdAt: new Date().toISOString(),
        };

        io.to(`channel:${data.channelId}`).emit("new_channel_message", msgPayload);

        // Mention notifications
        if (data.mentions?.length) {
          for (const mentionedId of data.mentions) {
            const sockets = onlineUsers.get(mentionedId);
            if (sockets) {
              for (const sid of sockets) {
                io.to(sid).emit("mention_notification", {
                  channelId: data.channelId,
                  fromUserId: currentUserId,
                  fromUserName: sender?.name ?? "Usuário",
                  messagePreview: data.content.substring(0, 100),
                });
              }
            }
          }
        }
      } catch {
        socket.emit("message_error", { message: "Erro ao enviar mensagem" });
      }
    });

    // ── Send direct message ───────────────────────────────────────────────────
    socket.on("direct_message", async (data: { receiverId: number; content: string }) => {
      if (!currentUserId) { socket.emit("dm_error", { message: "Não autenticado" }); return; }
      if (!data.content?.trim()) { socket.emit("dm_error", { message: "Mensagem vazia" }); return; }

      try {
        const db = await getDb();
        if (!db) { socket.emit("dm_error", { message: "DB indisponível" }); return; }

        const result = await db.insert(directMessages).values({
          senderId: currentUserId,
          receiverId: data.receiverId,
          content: data.content.trim(),
        });

        const [sender] = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.id, currentUserId))
          .limit(1);

        const dmPayload = {
          id: (result as unknown as { insertId: number }).insertId,
          senderId: currentUserId,
          senderName: sender?.name ?? "Usuário",
          receiverId: data.receiverId,
          content: data.content.trim(),
          createdAt: new Date().toISOString(),
        };

        // Deliver to receiver if online
        const receiverSockets = onlineUsers.get(data.receiverId);
        if (receiverSockets) {
          for (const sid of receiverSockets) io.to(sid).emit("new_dm", dmPayload);
        }

        socket.emit("dm_sent", dmPayload);
      } catch {
        socket.emit("dm_error", { message: "Erro ao enviar mensagem" });
      }
    });

    // ── Typing indicators ─────────────────────────────────────────────────────
    socket.on("typing_start", (data: { channelId: number }) => {
      if (!currentUserId) return;
      socket.to(`channel:${data.channelId}`).emit("user_typing", { userId: currentUserId, channelId: data.channelId });
    });

    socket.on("typing_stop", (data: { channelId: number }) => {
      if (!currentUserId) return;
      socket.to(`channel:${data.channelId}`).emit("user_stopped_typing", { userId: currentUserId, channelId: data.channelId });
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      if (!currentUserId) return;
      const sockets = onlineUsers.get(currentUserId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(currentUserId);
          io.emit("user_offline", { userId: currentUserId });
        }
      }
    });
  });

  return io;
}

export function getOnlineUsers(): number[] {
  return Array.from(onlineUsers.keys());
}
