import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as congressApi from "./congress-api";
import { sendPushToUser } from "./_core/push";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";
import { passwordResets, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    registerEmail: publicProcedure
      .input(z.object({
        name: z.string().min(2).max(100),
        email: z.string().email().max(320),
        password: z.string().min(6).max(128),
      }))
      .mutation(async ({ ctx, input }) => {
        const { sdk } = await import("./_core/sdk");
        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
        const existing = await db.getUserByEmail(input.email);
        if (existing) throw new Error("Este e-mail já está cadastrado. Faça login.");
        const openId = `email:${input.email.toLowerCase().trim()}`;
        const passwordHash = await bcrypt.hash(input.password, 10);
        await db.upsertUser({
          openId,
          name: input.name,
          email: input.email.toLowerCase().trim(),
          loginMethod: "email",
          lastSignedIn: new Date(),
        });
        const user = await db.getUserByOpenId(openId);
        if (user) await db.setUserPasswordHash(user.id, passwordHash);
        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return {
          success: true,
          sessionToken,
          user: {
            id: user?.id ?? null,
            openId,
            name: input.name,
            email: input.email.toLowerCase().trim(),
            loginMethod: "email" as const,
          },
        };
      }),

    loginEmail: publicProcedure
      .input(z.object({
        email: z.string().email().max(320),
        password: z.string().min(1).max(128),
      }))
      .mutation(async ({ ctx, input }) => {
        const { sdk } = await import("./_core/sdk");
        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
        const user = await db.getUserByEmail(input.email);
        if (!user) throw new Error("E-mail não encontrado. Verifique ou crie uma conta.");
        if (!user.passwordHash) throw new Error("Esta conta usa outro método de login (Gov.br). Tente outra opção.");
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) throw new Error("Senha incorreta. Tente novamente.");
        await db.upsertUser({
          openId: user.openId,
          name: user.name ?? "",
          email: user.email ?? null,
          loginMethod: "email",
          lastSignedIn: new Date(),
        });
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return {
          success: true,
          sessionToken,
          user: {
            id: user.id,
            openId: user.openId,
            name: user.name,
            email: user.email,
            loginMethod: "email" as const,
          },
        };
      }),

    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const { email } = input;
        const user = await db.getUserByEmail(email);
        if (!user) {
          return { success: true, message: "Se o e-mail existir, você receberá um link." };
        }
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await db.db.delete(passwordResets).where(eq(passwordResets.email, email));
        await db.db.insert(passwordResets).values({ email, token, expiresAt });
        const resend = new Resend(process.env.RESEND_API_KEY);
        const resetLink = `https://lobby-popular-full.onrender.com/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        await resend.emails.send({
          from: "noreply@populus.com",
          to: email,
          subject: "Redefinição de senha - Populus",
          html: `<p>Você solicitou a redefinição de senha.</p>
                 <p>Clique no link abaixo para criar uma nova senha (válido por 1 hora):</p>
                 <a href="${resetLink}">${resetLink}</a>
                 <p>Se não foi você, ignore este e-mail.</p>`,
        });
        return { success: true };
      }),

    resetPassword: publicProcedure
      .input(z.object({
        email: z.string().email(),
        token: z.string(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        const { email, token, newPassword } = input;
        const resetRecord = await db.db.select()
          .from(passwordResets)
          .where(eq(passwordResets.token, token))
          .limit(1);
        const record = resetRecord[0];
        if (!record || record.email !== email) throw new Error("Link inválido.");
        if (record.expiresAt < new Date()) throw new Error("Link expirado. Solicite uma nova redefinição.");
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.db.update(users)
          .set({ passwordHash: hashedPassword })
          .where(eq(users.email, email));
        await db.db.delete(passwordResets).where(eq(passwordResets.id, record.id));
        return { success: true };
      }),

    loginGovBr: publicProcedure
      .input(z.object({
        cpf: z.string().min(11).max(14),
        name: z.string().min(2).max(100),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const cpfDigits = input.cpf.replace(/\D/g, "");
        if (cpfDigits.length !== 11) throw new Error("CPF inválido. Digite os 11 dígitos.");
        const openId = `govbr:${cpfDigits}`;
        const { sdk } = await import("./_core/sdk");
        await db.upsertUser({
          openId,
          name: input.name,
          email: input.email ?? null,
          loginMethod: "govbr",
          lastSignedIn: new Date(),
        });
        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name,
          expiresInMs: 365 * 24 * 60 * 60 * 1000,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
        const user = await db.getUserByOpenId(openId);
        return {
          success: true,
          sessionToken,
          user: {
            id: user?.id ?? null,
            openId,
            name: input.name,
            email: input.email ?? null,
            loginMethod: "govbr" as const,
          },
        };
      }),
  }),

  constitution: router({
    list: publicProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(({ input }) => db.getConstitutionArticles(input?.search)),
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getConstitutionArticleById(input.id)),
  }),

  lobbies: router({
    list: publicProcedure
      .input(z.object({
        category: z.enum(["national", "local"]).optional(),
        petitionCategory: z.enum(["infrastructure", "education", "health", "security", "environment", "human_rights", "economy", "transparency", "culture"]).optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        state: z.string().max(2).optional(),
        city: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(({ input }) => db.getLobbies(input ?? {})),

    localWithCoords: publicProcedure.query(() => db.getLocalLobbiesWithCoords()),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        await db.incrementLobbyView(input.id);
        return db.getLobbyById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(5).max(255),
        description: z.string().min(20),
        objective: z.string().min(10),
        category: z.enum(["national", "local"]),
        constitutionArticleId: z.number(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        locationAddress: z.string().optional(),
        locationCity: z.string().optional(),
        locationState: z.string().max(2).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.category === "local" && (!input.latitude || !input.longitude)) {
          throw new Error("Lobbys locais precisam de localização no mapa.");
        }
        let aiAnalysis: { score: number; flags: string[]; reason: string; requiresReview: boolean } | null = null;
        try {
          const aiPrompt = `Analise este lobby cívico brasileiro e identifique se há problemas:

Título: ${input.title}
Descrição: ${input.description}
Objetivo: ${input.objective}

Responda APENAS com JSON no formato:
{"score": 0-100, "flags": ["hate_speech"|"criminal_content"|"fake_news"|"no_legal_basis"|"spam"], "reason": "explicação breve", "requiresReview": true|false}

Score 0 = totalmente seguro, 100 = extremamente problemático.
requiresReview = true se score >= 40 ou houver qualquer flag.`;
          const aiResult = await invokeLLM({ messages: [{ role: "user", content: aiPrompt }], maxTokens: 200 });
          const aiResponse = aiResult.choices[0]?.message?.content ?? "";
          const aiText = typeof aiResponse === "string" ? aiResponse : JSON.stringify(aiResponse);
          const jsonMatch = aiText.match(/\{[\s\S]*\}/);
          if (jsonMatch) aiAnalysis = JSON.parse(jsonMatch[0]);
        } catch { }

        const lobbyStatus = aiAnalysis?.requiresReview ? "pending" : "active";
        const insertId = await db.createLobby({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          objective: input.objective,
          category: input.category,
          constitutionArticleId: input.constitutionArticleId,
          status: lobbyStatus,
          latitude: input.latitude,
          longitude: input.longitude,
          locationAddress: input.locationAddress,
          locationCity: input.locationCity,
          locationState: input.locationState,
        });

        if (aiAnalysis?.requiresReview) {
          await db.createModerationQueueItem({
            contentType: "lobby",
            contentId: insertId,
            contentTitle: input.title,
            contentText: input.description,
            userId: ctx.user.id,
            aiScore: aiAnalysis.score,
            aiFlags: aiAnalysis.flags,
            aiReason: aiAnalysis.reason,
          });
        }

        await db.recordActivity(ctx.user.id, "lobby_created", insertId, input.title);
        await db.incrementProfileStat(ctx.user.id, "lobbiesCreated");
        const pointsResult = await db.awardPoints(ctx.user.id, "lobby_create", insertId, `Criou lobby: ${input.title}`);
        await db.checkAndUnlockAchievements(ctx.user.id);
        return {
          id: insertId,
          pointsAwarded: 50,
          levelUp: pointsResult.levelUp,
          newLevel: pointsResult.newLevel,
          requiresReview: aiAnalysis?.requiresReview ?? false,
          aiFlags: aiAnalysis?.flags ?? [],
        };
      }),

    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "active", "rejected", "closed"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "moderator") {
          throw new Error("Sem permissão para alterar status.");
        }
        await db.updateLobbyStatus(input.id, input.status);
        return { success: true };
      }),

    support: protectedProcedure
      .input(z.object({ lobbyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.supportLobby(input.lobbyId, ctx.user.id);
        if (!result.alreadySupported) {
          const lobby = await db.getLobbyById(input.lobbyId);
          await db.recordActivity(ctx.user.id, "lobby_supported", input.lobbyId, lobby?.title ?? undefined, lobby?.petitionCategory ?? undefined);
          await db.incrementProfileStat(ctx.user.id, "lobbiesSupported");
          const pointsResult = await db.awardPoints(ctx.user.id, "lobby_support", input.lobbyId, `Apoiou lobby: ${lobby?.title ?? "lobby"}`);
          await db.checkAndUnlockAchievements(ctx.user.id);
          return { ...result, pointsAwarded: 10, levelUp: pointsResult.levelUp, newLevel: pointsResult.newLevel };
        }
        return { ...result, pointsAwarded: 0, levelUp: false, newLevel: null };
      }),

    unsupport: protectedProcedure
      .input(z.object({ lobbyId: z.number() }))
      .mutation(({ ctx, input }) => db.unsupportLobby(input.lobbyId, ctx.user.id)),

    isSupporting: protectedProcedure
      .input(z.object({ lobbyId: z.number() }))
      .query(({ ctx, input }) => db.isUserSupporting(input.lobbyId, ctx.user.id)),

    mySupports: protectedProcedure.query(({ ctx }) => db.getUserLobbySupports(ctx.user.id)),

    alliances: publicProcedure
      .input(z.object({ lobbyId: z.number() }))
      .query(({ input }) => db.getLobbyAlliances(input.lobbyId)),
  }),

  communities: router({
    list: publicProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(({ input }) => db.getCommunities(input?.search)),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getCommunityById(input.id)),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(3).max(255),
        description: z.string().min(10),
        theme: z.string().min(2).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        const insertId = await db.createCommunity({ ...input, creatorId: ctx.user.id });
        await db.recordActivity(ctx.user.id, "community_created", insertId, input.name);
        await db.incrementProfileStat(ctx.user.id, "communitiesJoined");
        return { id: insertId };
      }),

    join: protectedProcedure
      .input(z.object({ communityId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.joinCommunity(input.communityId, ctx.user.id);
        const community = await db.getCommunityById(input.communityId);
        await db.recordActivity(ctx.user.id, "community_joined", input.communityId, community?.name ?? undefined);
        await db.incrementProfileStat(ctx.user.id, "communitiesJoined");
      }),

    leave: protectedProcedure
      .input(z.object({ communityId: z.number() }))
      .mutation(({ ctx, input }) => db.leaveCommunity(input.communityId, ctx.user.id)),

    isMember: protectedProcedure
      .input(z.object({ communityId: z.number() }))
      .query(({ ctx, input }) => db.isCommunityMember(input.communityId, ctx.user.id)),

    members: publicProcedure
      .input(z.object({ communityId: z.number() }))
      .query(({ input }) => db.getCommunityMembers(input.communityId)),

    myCommunities: protectedProcedure.query(({ ctx }) => db.getUserCommunities(ctx.user.id)),

    allyLobby: protectedProcedure
      .input(z.object({ communityId: z.number(), lobbyId: z.number() }))
      .mutation(({ input }) => db.allyLobby(input.communityId, input.lobbyId)),

    alliances: publicProcedure
      .input(z.object({ communityId: z.number() }))
      .query(({ input }) => db.getCommunityAlliances(input.communityId)),
  }),

  forum: router({
    posts: publicProcedure
      .input(z.object({ communityId: z.number() }))
      .query(({ input }) => db.getForumPosts(input.communityId)),

    postById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getForumPostById(input.id)),

    createPost: protectedProcedure
      .input(z.object({
        communityId: z.number(),
        title: z.string().min(3).max(255),
        content: z.string().min(10),
      }))
      .mutation(async ({ ctx, input }) => {
        const postId = await db.createForumPost({ ...input, userId: ctx.user.id });
        await db.recordActivity(ctx.user.id, "post_created", postId, input.title);
        return postId;
      }),

    comments: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(({ input }) => db.getForumComments(input.postId)),

    createComment: protectedProcedure
      .input(z.object({ postId: z.number(), content: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const commentId = await db.createForumComment({ ...input, userId: ctx.user.id });
        await db.recordActivity(ctx.user.id, "comment_created", input.postId, undefined);
        return commentId;
      }),
  }),

  news: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(({ input }) => db.getNewsItems(input?.limit ?? 20)),
  }),

  interactions: router({
    track: protectedProcedure
      .input(z.object({
        lobbyId: z.number().optional(),
        communityId: z.number().optional(),
        action: z.enum(["view", "support", "comment", "share", "join"]),
        petitionCategory: z.string().optional(),
        locationState: z.string().max(2).optional(),
      }))
      .mutation(({ ctx, input }) => db.trackInteraction({
        userId: ctx.user.id,
        lobbyId: input.lobbyId,
        communityId: input.communityId,
        action: input.action,
        petitionCategory: input.petitionCategory,
        locationState: input.locationState,
      })),

    myPreferences: protectedProcedure
      .query(({ ctx }) => db.getUserPreferences(ctx.user.id)),
  }),

  recommendations: router({
    lobbies: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(({ ctx, input }) => db.getRecommendedLobbies(ctx.user.id, input?.limit ?? 10)),

    communities: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(({ ctx, input }) => db.getRecommendedCommunities(ctx.user.id, input?.limit ?? 6)),

    similarUsers: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(({ ctx, input }) => db.getSimilarUsers(ctx.user.id, input?.limit ?? 5)),
  }),

  users: router({
    profile: protectedProcedure
      .query(({ ctx }) => db.getUserProfile(ctx.user.id)),

    publicProfile: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ input }) => db.getUserProfile(input.userId)),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(2).max(100).optional(),
        bio: z.string().max(500).optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(2).optional(),
        interests: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.name) {
          await db.updateUserName(ctx.user.id, { name: input.name });
        }
        await db.upsertUserProfile(ctx.user.id, {
          bio: input.bio,
          city: input.city,
          state: input.state,
          interests: input.interests,
        });
        return { success: true };
      }),

    search: publicProcedure
      .input(z.object({ query: z.string().min(2), limit: z.number().optional() }))
      .query(({ input }) => db.searchUsers(input.query, input.limit ?? 20)),

    follow: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(({ ctx, input }) => db.followUser(ctx.user.id, input.userId)),

    unfollow: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(({ ctx, input }) => db.unfollowUser(ctx.user.id, input.userId)),

    isFollowing: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ ctx, input }) => db.isFollowing(ctx.user.id, input.userId)),

    followers: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => db.getFollowers(input.userId, input.limit ?? 20)),

    following: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => db.getFollowing(input.userId, input.limit ?? 20)),

    activityFeed: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => db.getUserActivityFeed(input.userId, input.limit ?? 30)),

    myLobbies: protectedProcedure
      .query(({ ctx }) => db.getUserLobbies(ctx.user.id)),

    lobbiesByUser: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ input }) => db.getUserLobbies(input.userId)),

    supportedLobbies: protectedProcedure
      .query(({ ctx }) => db.getUserSupportedLobbies(ctx.user.id)),

    myCommunities: protectedProcedure
      .query(({ ctx }) => db.getUserCommunities(ctx.user.id)),
  }),

  feed: router({
    personalized: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(({ ctx, input }) => db.getPersonalizedFeed(ctx.user.id, input?.limit ?? 30)),
  }),

  channels: router({
    list: publicProcedure
      .input(z.object({ communityId: z.number() }))
      .query(({ input }) => db.getChannelsByCommunity(input.communityId)),
    create: protectedProcedure
      .input(z.object({
        communityId: z.number(),
        name: z.string().min(2).max(50),
        slug: z.string().min(2).max(50),
        description: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(({ input }) => db.createChannel(input)),
    messages: publicProcedure
      .input(z.object({ channelId: z.number(), limit: z.number().optional(), before: z.number().optional() }))
      .query(({ input }) => db.getChannelMessages(input.channelId, input.limit ?? 50, input.before)),
  }),

  dms: router({
    conversations: protectedProcedure
      .query(({ ctx }) => db.getDMConversations(ctx.user.id)),
    messages: protectedProcedure
      .input(z.object({ partnerId: z.number(), limit: z.number().optional() }))
      .query(({ ctx, input }) => db.getDMMessages(ctx.user.id, input.partnerId, input.limit ?? 50)),
  }),

  milestones: router({
    list: publicProcedure
      .input(z.object({ lobbyId: z.number() }))
      .query(({ input }) => db.getLobbyMilestones(input.lobbyId)),
  }),

  timeline: router({
    list: publicProcedure
      .input(z.object({ lobbyId: z.number() }))
      .query(({ input }) => db.getLobbyTimeline(input.lobbyId)),
    addEvent: protectedProcedure
      .input(z.object({
        lobbyId: z.number(),
        type: z.enum(["created", "milestone", "update", "media", "response", "concluded"]),
        title: z.string().min(2).max(200),
        description: z.string().optional(),
        mediaUrl: z.string().optional(),
      }))
      .mutation(({ input }) => db.addTimelineEvent(input)),
    updateStatus: protectedProcedure
      .input(z.object({
        lobbyId: z.number(),
        status: z.enum(["mobilization", "pressure", "processing", "concluded"]),
      }))
      .mutation(({ input }) => db.updateLobbyStatusExtended(input.lobbyId, input.status)),
  }),

  geo: router({
    lobbySupports: publicProcedure
      .input(z.object({ lobbyId: z.number() }))
      .query(({ input }) => db.getLobbySupportsGeo(input.lobbyId)),
  }),

  pressure: router({
    track: protectedProcedure
      .input(z.object({
        lobbyId: z.number(),
        channel: z.enum(["whatsapp", "email", "twitter", "instagram", "phone", "copy"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.trackPressureAction({ userId: ctx.user.id, ...input });
        const pointsResult = await db.awardPoints(ctx.user.id, "pressure_action", input.lobbyId, `Pressão via ${input.channel}`);
        await db.checkAndUnlockAchievements(ctx.user.id);
        return { success: true, pointsAwarded: 20, levelUp: pointsResult.levelUp, newLevel: pointsResult.newLevel };
      }),
    stats: publicProcedure
      .input(z.object({ lobbyId: z.number() }))
      .query(({ input }) => db.getPressureStats(input.lobbyId)),
    generateCards: publicProcedure
      .input(z.object({ lobbyId: z.number() }))
      .query(async ({ input }) => {
        const lobby = await db.getLobbyById(input.lobbyId);
        if (!lobby) throw new Error("Lobby não encontrado");
        return db.generatePressureCards(lobby);
      }),
  }),

  smartMilestones: router({
    list: publicProcedure
      .input(z.object({ lobbyId: z.number() }))
      .query(({ input }) => db.getSmartMilestones(input.lobbyId)),
    checkAchieve: protectedProcedure
      .input(z.object({ lobbyId: z.number(), currentCount: z.number() }))
      .mutation(({ input }) => db.checkAndAchieveSmartMilestones(input.lobbyId, input.currentCount)),
  }),

  populus: router({
    legalAnalysis: publicProcedure
      .input(z.object({ title: z.string(), description: z.string(), category: z.string().optional() }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é o Assistente Populus, especialista em direito constitucional e lobby cidadão brasileiro. Sempre responda em português do Brasil com JSON válido." },
            { role: "user", content: `Analise juridicamente esta demanda cidadã:\n\nTítulo: ${input.title}\nDescrição: ${input.description}\nCategoria: ${input.category || "Geral"}\n\nForneça JSON com: constitutionalArticles (array de {article, description, relevance}), federalLaws (array de {law, description}), legalArguments (array de strings), jurisprudence (array de {case, outcome}), successProbability (0-100), summary (string).` },
          ],
          response_format: { type: "json_object" },
        });
        return JSON.parse(response.choices[0].message.content as string);
      }),
  }),

  priorityAgenda: router({
    list: publicProcedure.query(() => db.getPriorityAgendaLobbies()),
  }),

  plebiscites: router({
    activate: protectedProcedure
      .input(z.object({ lobbyId: z.number() }))
      .mutation(async ({ input }) => {
        const lobby = await db.getLobbyById(input.lobbyId);
        if (!lobby) throw new Error("Lobby não encontrado.");
        if (lobby.supportCount < 5000) {
          throw new Error(`Este lobby precisa de 5.000 apoios para ativar um plebiscito. Atualmente tem ${lobby.supportCount} apoios.`);
        }
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + 7);
        const id = await db.createLobbyPlebiscite({
          lobbyId: input.lobbyId,
          title: `Este lobby deve se tornar Pauta Prioritária do Populus?`,
          description: `A comunidade decide se o lobby "${lobby.title}" deve receber destaque na página inicial por 7 dias e uma campanha de pressão em massa.`,
          endsAt,
        });
        return { id, success: true };
      }),
  }),

  nationalPlebiscites: router({
    list: publicProcedure
      .input(z.object({ status: z.enum(["active", "closed", "sent_to_chamber"]).optional() }).optional())
      .query(({ input }) => db.getNationalPlebiscites(input?.status)),
  }),

  powerMetrics: router({
    get: publicProcedure.query(() => db.getPowerMetrics()),
  }),

  congress: router({
    searchBills: publicProcedure
      .input(z.object({ keyword: z.string().min(2), year: z.number().optional() }))
      .query(async ({ input }) => {
        const bills = await congressApi.searchAllBills(input.keyword);
        if (bills.length === 0) return congressApi.getFallbackBills(input.keyword);
        return bills;
      }),
  }),

  gamification: router({
    myStats: protectedProcedure
      .query(async ({ ctx }) => {
        const totalPoints = await db.getUserPointsTotal(ctx.user.id);
        const level = db.getLevelForPoints(totalPoints);
        return { totalPoints, level };
      }),
  }),

  moderation: router({
    canModerate: protectedProcedure
      .query(async ({ ctx }) => {
        const totalPoints = await db.getUserPointsTotal(ctx.user.id);
        const level = db.getLevelForPoints(totalPoints);
        return { canModerate: ctx.user.role === "admin" || ctx.user.role === "moderator" || level.level >= 4 };
      }),
  }),

  privacy: router({
    getSettings: protectedProcedure
      .query(async ({ ctx }) => {
        const settings = await db.getPrivacySettings(ctx.user.id);
        return settings ?? await db.getDefaultPrivacySettings();
      }),
  }),

  press: router({
    register: publicProcedure
      .input(z.object({
        name: z.string().min(2).max(200),
        email: z.string().email().max(200),
        outlet: z.string().min(2).max(200),
        role: z.string().max(100).optional(),
        phone: z.string().max(30).optional(),
        categories: z.array(z.string()).default([]),
        regions: z.array(z.string()).default([]),
        minSupportThreshold: z.number().int().min(100).max(100000).default(1000),
      }))
      .mutation(async ({ input }) => {
        await db.upsertPressJournalist({
          name: input.name,
          email: input.email,
          outlet: input.outlet,
          role: input.role,
          phone: input.phone,
          categories: JSON.stringify(input.categories),
          regions: JSON.stringify(input.regions),
          minSupportThreshold: input.minSupportThreshold,
        });
        return { success: true, message: "Cadastro realizado com sucesso!" };
      }),
  }),

  citizenFeed: router({
    forMap: publicProcedure.query(async () => db.getCitizenPostsForMap()),
    list: publicProcedure
      .input(z.object({ limit: z.number().int().min(1).max(50).default(20), offset: z.number().int().min(0).default(0), category: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const viewerUserId = ctx.user?.id;
        return db.getCitizenFeed({ ...input, viewerUserId });
      }),
  }),

  invite: router({
    validate: publicProcedure
      .input(z.object({ code: z.string().min(1) }))
      .query(async ({ input }) => db.validateInviteCode(input.code.trim().toUpperCase())),
  }),

  pushTokens: router({
    register: protectedProcedure
      .input(z.object({ token: z.string().min(1), platform: z.enum(["expo", "apns", "fcm"]).default("expo") }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertPushToken(ctx.user.id, input.token, input.platform);
        return { success: true };
      }),
  }),

  contact: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(2).max(100),
        email: z.string().email().max(320),
        phone: z.string().max(20).optional(),
        state: z.string().length(2).optional(),
        city: z.string().max(100).optional(),
        interests: z.array(z.string()).max(10).default([]),
        message: z.string().max(1000).optional(),
        type: z.enum(["tester", "partner", "press", "other"]).default("tester"),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createContactSubmission({
          name: input.name,
          email: input.email.toLowerCase().trim(),
          phone: input.phone ?? null,
          state: input.state ?? null,
          city: input.city ?? null,
          interests: input.interests.length ? JSON.stringify(input.interests) : null,
          message: input.message ?? null,
          type: input.type,
          userId: ctx.user?.id ?? null,
        });
        return { success: true, id };
      }),
  }),
});

export type AppRouter = typeof appRouter;
