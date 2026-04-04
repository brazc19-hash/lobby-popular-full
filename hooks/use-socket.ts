import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./use-auth";

const WS_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:3000";

type ChannelMessage = {
  id: number;
  channelId: number;
  userId: number;
  userName: string;
  content: string;
  mentions: number[];
  replyToId: number | null;
  createdAt: string;
};

type DMMessage = {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  content: string;
  createdAt: string;
};

export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const socket = io(WS_URL, {
      path: "/ws",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("authenticate", { userId: user.id });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user?.id]);

  const joinChannel = useCallback((channelId: number, communityId: number) => {
    socketRef.current?.emit("join_channel", { channelId, communityId });
  }, []);

  const leaveChannel = useCallback((channelId: number) => {
    socketRef.current?.emit("leave_channel", { channelId });
  }, []);

  const sendChannelMessage = useCallback((
    channelId: number,
    content: string,
    mentions?: number[],
    replyToId?: number,
  ) => {
    socketRef.current?.emit("channel_message", { channelId, content, mentions, replyToId });
  }, []);

  const sendDM = useCallback((receiverId: number, content: string) => {
    socketRef.current?.emit("direct_message", { receiverId, content });
  }, []);

  const onChannelMessage = useCallback((handler: (msg: ChannelMessage) => void) => {
    socketRef.current?.on("new_channel_message", handler);
    return () => { socketRef.current?.off("new_channel_message", handler); };
  }, []);

  const onDM = useCallback((handler: (msg: DMMessage) => void) => {
    socketRef.current?.on("new_dm", handler);
    return () => { socketRef.current?.off("new_dm", handler); };
  }, []);

  const onDMSent = useCallback((handler: (msg: DMMessage) => void) => {
    socketRef.current?.on("dm_sent", handler);
    return () => { socketRef.current?.off("dm_sent", handler); };
  }, []);

  const onMentionNotification = useCallback((handler: (data: { channelId: number; fromUserId: number; fromUserName: string; messagePreview: string }) => void) => {
    socketRef.current?.on("mention_notification", handler);
    return () => { socketRef.current?.off("mention_notification", handler); };
  }, []);

  const sendTypingStart = useCallback((channelId: number) => {
    socketRef.current?.emit("typing_start", { channelId });
  }, []);

  const sendTypingStop = useCallback((channelId: number) => {
    socketRef.current?.emit("typing_stop", { channelId });
  }, []);

  const onUserTyping = useCallback((handler: (data: { userId: number; channelId: number }) => void) => {
    socketRef.current?.on("user_typing", handler);
    return () => { socketRef.current?.off("user_typing", handler); };
  }, []);

  const onUserStoppedTyping = useCallback((handler: (data: { userId: number; channelId: number }) => void) => {
    socketRef.current?.on("user_stopped_typing", handler);
    return () => { socketRef.current?.off("user_stopped_typing", handler); };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinChannel,
    leaveChannel,
    sendChannelMessage,
    sendDM,
    onChannelMessage,
    onDM,
    onDMSent,
    onMentionNotification,
    sendTypingStart,
    sendTypingStop,
    onUserTyping,
    onUserStoppedTyping,
  };
}
