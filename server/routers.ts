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


export const appRouter = router({
  system: systemRouter,
  auth: auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // ─── Email / Password Auth ─────────────────────────────────────────────
    registerEmail: publicProcedure
      .input(z.object({
        name: z.string().min(2).max(100),
        email: z.string().email().max(320),
        password: z.string().min(6).max(128),
      }))
      .mutation(async ({ ctx, input }) => {
        const { sdk } = await import("./_core/sdk");
        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
        // Check if e-mail already exists
        const existing = await db.getUserByEmail(input.email);
        if (existing) throw new Error("Este e-mail já está cadastrado. Faça login.");
        // Create stable openId for email users
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

    // ─── Esqueci minha senha / Recuperação ─────────────────────────────────
    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const { email } = input;

        // Verificar se o e-mail existe
        const user = await db.getUserByEmail(email);
        if (!user) {
          return { success: true, message: "Se o e-mail existir, você receberá um link." };
        }

        // Gerar token único
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        // Deletar tokens antigos para este e-mail
        await db.db.delete(passwordResets).where(eq(passwordResets.email, email));

        // Inserir novo token
        await db.db.insert(passwordResets).values({
          email,
          token,
          expiresAt,
        });

        // Configurar Resend (precisa da chave API)
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

        // Buscar token válido
        const resetRecord = await db.db.select()
          .from(passwordResets)
          .where(eq(passwordResets.token, token))
          .limit(1);

        const record = resetRecord[0];
        if (!record || record.email !== email) {
          throw new Error("Link inválido.");
        }

        if (record.expiresAt < new Date()) {
          throw new Error("Link expirado. Solicite uma nova redefinição.");
        }

        // Atualizar a senha do usuário
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.db.update(users)
          .set({ passwordHash: hashedPassword })
          .where(eq(users.email, email));

        // Remover token usado
        await db.db.delete(passwordResets).where(eq(passwordResets.id, record.id));

        return { success: true };
      }),

    // ─── Gov.br Auth ───────────────────────────────────────────────────────
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
    // ─── Email / Password Auth ─────────────────────────────────────────────
    // Cadastro com e-mail e senha
    registerEmail: publicProcedure
      .input(z.object({
        name: z.string().min(2).max(100),
        email: z.string().email().max(320),
        password: z.string().min(6).max(128),
      }))
      .mutation(async ({ ctx, input }) => {
        const { sdk } = await import("./_core/sdk");
        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
        // Check if e-mail already exists
        const existing = await db.getUserByEmail(input.email);
        if (existing) throw new Error("Este e-mail já está cadastrado. Faça login.");
        // Create stable openId for email users
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
    // Login com e-mail e senha
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
        // Update last sign in
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
    // Gov.br simulated login — accepts CPF + name, creates/upserts user and returns session token
    loginGovBr: publicProcedure
      .input(z.object({
        cpf: z.string().min(11).max(14),
        name: z.string().min(2).max(100),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Normalize CPF to digits only
        const cpfDigits = input.cpf.replace(/\D/g, "");
        if (cpfDigits.length !== 11) throw new Error("CPF inválido. Digite os 11 dígitos.");
        // Create a stable openId for this Gov.br user
        const openId = `govbr:${cpfDigits}`;
        const { sdk } = await import("./_core/sdk");
        // Upsert user in database
        await db.upsertUser({
          openId,
          name: input.name,
          email: input.email ?? null,
          loginMethod: "govbr",
          lastSignedIn: new Date(),
        });
        // Generate JWT session token
        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name,
          expiresInMs: 365 * 24 * 60 * 60 * 1000,
        });
        // Set cookie for web
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

  // ─── Seed ──────────────────────────────────────────────────────────────────
  seed: router({
    run: publicProcedure.mutation(async () => {
      await db.seedData();
      return { success: true };
    }),
    // Force re-seed: clears lobbies/communities and re-inserts rich demo data
    demo: publicProcedure.mutation(async () => {
      await db.seedDemoData();
      return { success: true };
    }),
  }),

  // ─── Constitution Articles ─────────────────────────────────────────────────
  constitution: router({
    list: publicProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(({ input }) => db.getConstitutionArticles(input?.search)),
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getConstitutionArticleById(input.id)),
  }),

  // ─── Lobbies ───────────────────────────────────────────────────────────────
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
        // IA de primeiro filtro: analisa conteúdo antes de publicar
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
        } catch { /* IA indisponível, continua sem análise */ }

        // Se IA sinalizou problema, cria com status pending e entra na fila
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

        // Adicionar à fila de moderação se IA sinalizou
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

        // Record activity
        await db.recordActivity(ctx.user.id, "lobby_created", insertId, input.title);
        await db.incrementProfileStat(ctx.user.id, "lobbiesCreated");
        // Award points: +50 por criar lobby
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
          // Award points: +10 por apoiar lobby
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

  // ─── Communities ───────────────────────────────────────────────────────────
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

  // ─── Forum ─────────────────────────────────────────────────────────────────
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

  // ─── News ─────────────────────────────────────────────────────────────────
  news: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(({ input }) => db.getNewsItems(input?.limit ?? 20)),
  }),

  // ─── Interactions ─────────────────────────────────────────────────────────
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

  // ─── Recommendations ──────────────────────────────────────────────────────
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

  // ─── Users / Profiles ─────────────────────────────────────────────────────
  users: router({
    // Perfil do usuário autenticado
    profile: protectedProcedure
      .query(({ ctx }) => db.getUserProfile(ctx.user.id)),

    // Perfil público de qualquer usuário
    publicProfile: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ input }) => db.getUserProfile(input.userId)),

    // Atualizar perfil (bio, cidade, estado, interesses)
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

    // Buscar usuários por nome
    search: publicProcedure
      .input(z.object({ query: z.string().min(2), limit: z.number().optional() }))
      .query(({ input }) => db.searchUsers(input.query, input.limit ?? 20)),

    // Seguir um usuário
    follow: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(({ ctx, input }) => db.followUser(ctx.user.id, input.userId)),

    // Deixar de seguir
    unfollow: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(({ ctx, input }) => db.unfollowUser(ctx.user.id, input.userId)),

    // Verificar se está seguindo
    isFollowing: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ ctx, input }) => db.isFollowing(ctx.user.id, input.userId)),

    // Lista de seguidores
    followers: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => db.getFollowers(input.userId, input.limit ?? 20)),

    // Lista de quem o usuário segue
    following: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => db.getFollowing(input.userId, input.limit ?? 20)),

    // Histórico de atividades do usuário
    activityFeed: publicProcedure
      .input(z.object({ userId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => db.getUserActivityFeed(input.userId, input.limit ?? 30)),

    // Lobbys criados pelo usuário
    myLobbies: protectedProcedure
      .query(({ ctx }) => db.getUserLobbies(ctx.user.id)),
    // Lobbys de um usuário público
    lobbiesByUser: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ input }) => db.getUserLobbies(input.userId)),

    // Lobbys que o usuário apoiou
    supportedLobbies: protectedProcedure
      .query(({ ctx }) => db.getUserSupportedLobbies(ctx.user.id)),

    // Comunidades do usuário
    myCommunities: protectedProcedure
      .query(({ ctx }) => db.getUserCommunities(ctx.user.id)),
  }),

  // ─── Personalized Feed ────────────────────────────────────────────────────
  feed: router({
    personalized: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(({ ctx, input }) => db.getPersonalizedFeed(ctx.user.id, input?.limit ?? 30)),
  }),

  // ─── Community Channels ──────────────────────────────────────────────────
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

  // ─── Direct Messages ────────────────────────────────────────────────────
  dms: router({
    conversations: protectedProcedure
      .query(({ ctx }) => db.getDMConversations(ctx.user.id)),
    messages: protectedProcedure
      .input(z.object({ partnerId: z.number(), limit: z.number().optional() }))
      .query(({ ctx, input }) => db.getDMMessages(ctx.user.id, input.partnerId, input.limit ?? 50)),
  }),

  // ─── Lobby Milestones ───────────────────────────────────────────────────
  milestones: router({
    list: publicProcedure
      .input(z.object({ lobbyId: z.number() }))
      .query(({ input }) => db.getLobbyMilestones(input.lobbyId)),
  }),

  // ─── Lobby Timeline ─────────────────────────────────────────────────────
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

   // ─── Geo Heatmap ─────────────────────────────────────────────────────────
  geo: router({
    lobbySupports: publicProcedure
      .input(z.object({ lobbyId: z.number() }))
      .query(({ input }) => db.getLobbySupportsGeo(input.lobbyId)),
  }),
  // ─── Pressure ────────────────────────────────────────────────────────────
  pressure: router({
    track: protectedProcedure
      .input(z.object({
        lobbyId: z.number(),
        channel: z.enum(["whatsapp", "email", "twitter", "instagram", "phone", "copy"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.trackPressureAction({ userId: ctx.user.id, ...input });
        // Award points: +20 por ação de pressão
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
  // ─── Sm  // ─── Smart Milestones ─────────────────────────────────────────
  smartMilestones: router({
    list: publicProcedure
      .input(z.object({ lobbyId: z.number() }))
      .query(({ input }) => db.getSmartMilestones(input.lobbyId)),
    checkAchieve: protectedProcedure
      .input(z.object({ lobbyId: z.number(), currentCount: z.number() }))
      .mutation(({ input }) => db.checkAndAchieveSmartMilestones(input.lobbyId, input.currentCount)),
  }),

  // ─── Assistente Populus (IA Estratégica) ────────────────────────────────
  populus: router({
    // Análise jurídica automática
    legalAnalysis: publicProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        category: z.string().optional(),
      }))
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

    // Curadoria de evidências
    evidenceCuration: publicProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        category: z.string().optional(),
        location: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é o Assistente Populus, curador de evidências para campanhas cidadãs brasileiras. Responda em português do Brasil com JSON válido." },
            { role: "user", content: `Para esta demanda cidadã, sugira evidências e dados:\n\nTítulo: ${input.title}\nDescrição: ${input.description}\nCategoria: ${input.category || "Geral"}\nLocalização: ${input.location || "Brasil"}\n\nForneça JSON com: statistics (array de {source, data, relevance}), evidenceSources (array de {name, url, description}), documentsToCollect (array de strings), laiQuestions (array de strings), impactIndicators (array de strings).` },
          ],
          response_format: { type: "json_object" },
        });
        return JSON.parse(response.choices[0].message.content as string);
      }),

    // Geração de conteúdo para mobilização
    generateContent: publicProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        supportCount: z.number().default(0),
        location: z.string().optional(),
        format: z.enum(["twitter", "instagram", "whatsapp", "email", "video30s", "video1min", "video3min"]),
      }))
      .mutation(async ({ input }) => {
        const formatMap: Record<string, string> = {
          twitter: "tweet de até 280 caracteres com hashtags",
          instagram: "legenda para Instagram com emojis e hashtags",
          whatsapp: "mensagem para WhatsApp informal e direta",
          email: "e-mail formal para parlamentar",
          video30s: "roteiro de vídeo de 30 segundos",
          video1min: "roteiro de vídeo de 1 minuto",
          video3min: "roteiro de vídeo de 3 minutos",
        };
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é o Assistente Populus, especialista em comunicação política cidadã brasileira. Crie conteúdo engajante e factual. Responda em português do Brasil com JSON válido." },
            { role: "user", content: `Crie conteúdo de mobilização (${formatMap[input.format]}) para:\n\nTítulo: ${input.title}\nDescrição: ${input.description}\nApoiadores: ${input.supportCount}\nLocalização: ${input.location || "Brasil"}\n\nForneça JSON com: content (texto principal), hashtags (array de strings), callToAction (string), tips (array de strings).` },
          ],
          response_format: { type: "json_object" },
        });
        return JSON.parse(response.choices[0].message.content as string);
      }),

    // Calculadora de impacto social e financeiro
    impactCalculator: publicProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        category: z.string().optional(),
        location: z.string().optional(),
        state: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é o Assistente Populus, especialista em análise de impacto de políticas públicas brasileiras. Use dados reais e estimativas fundamentadas. Responda em português do Brasil com JSON válido." },
            { role: "user", content: `Calcule o impacto desta demanda:\n\nTítulo: ${input.title}\nDescrição: ${input.description}\nCategoria: ${input.category || "Geral"}\nLocalização: ${input.location || "Brasil"}\nEstado: ${input.state || "Não especificado"}\n\nForneça JSON com: affectedPopulation ({count, profile, breakdown}), problemCost ({monthly, annual, description}), solutionCost ({estimated, range, breakdown}), economicBenefit ({annual, description}), comparisons (array de {city, situation}), budgetSources (array de {source, amount, availability}), summary (string).` },
          ],
          response_format: { type: "json_object" },
        });
        return JSON.parse(response.choices[0].message.content as string);
      }),

    // Análise de cenário político
    politicalScenario: publicProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        category: z.string().optional(),
        state: z.string().optional(),
        city: z.string().optional(),
        supportCount: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é o Assistente Populus, especialista em análise política brasileira. Forneça análises realistas e estratégicas. Responda em português do Brasil com JSON válido." },
            { role: "user", content: `Analise o cenário político para:\n\nTítulo: ${input.title}\nDescrição: ${input.description}\nCategoria: ${input.category || "Geral"}\nEstado: ${input.state || "Não especificado"}\nCidade: ${input.city || "Não especificada"}\nApoiadores: ${input.supportCount}\n\nForneça JSON com: approvalProbability (0-100), probabilityJustification (string), mainObstacles (array), potentialAllies (array de {profile, motivation, approach}), potentialOpponents (array de {profile, motivation}), opportunities (array de {event, date, action}), recommendedStrategy (string), immediateAlerts (array de strings).` },
          ],
          response_format: { type: "json_object" },
        });
        return JSON.parse(response.choices[0].message.content as string);
      }),

    // Recomendação de parlamentares-alvo
    targetParliamentarians: publicProcedure
      .input(z.object({
        title: z.string(),
        category: z.string().optional(),
        state: z.string().optional(),
        city: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é o Assistente Populus, especialista em estratégia parlamentar brasileira. Forneça perfis estratégicos realistas. Responda em português do Brasil com JSON válido." },
            { role: "user", content: `Recomende perfis de parlamentares-alvo para:\n\nTítulo: ${input.title}\nCategoria: ${input.category || "Geral"}\nEstado: ${input.state || "Não especificado"}\nCidade: ${input.city || "Não especificada"}\n\nForneça JSON com: parliamentarians (array de {priority 1-5, profile, committee, personalizedArgument, contactChannel, supportProbability 0-100, approach}), strategy (string).` },
          ],
          response_format: { type: "json_object" },
        });
        return JSON.parse(response.choices[0].message.content as string);
      }),

    // Chat interativo com o assistente Populus
    chat: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })),
        lobbyContext: z.object({
          title: z.string(),
          description: z.string(),
          category: z.string().optional(),
          location: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        const systemPrompt = `Você é o Assistente Populus, especializado em lobby cidadão, direito constitucional brasileiro e participação política democrática. Ajude cidadãos a fortalecer causas com argumentos jurídicos, entender direitos constitucionais, criar estratégias de mobilização e pressionar parlamentares de forma legal. NUNCA apoie atividades ilegais ou antidemocráticas. Cite artigos da CF quando relevante. Responda em português do Brasil de forma clara e acessível.${input.lobbyContext ? `\n\nContexto: ${input.lobbyContext.title} - ${input.lobbyContext.description}` : ""}`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...input.messages,
          ],
        });
        return { content: response.choices[0].message.content as string, role: "assistant" as const };
      }),
  }),
  // ─── Pautas Prioritárias ─────────────────────────────────────────────────────
  priorityAgenda: router({
    // Listar lobbys com Pauta Prioritária ativa
    list: publicProcedure.query(() => db.getPriorityAgendaLobbies()),

    // Articular lobbys similares (busca lobbys com mesma categoria/tema)
    relatedLobbies: publicProcedure
      .input(z.object({ lobbyId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const lobby = await db.getLobbyById(input.lobbyId);
        if (!lobby) return [];
        const all = await db.getLobbies({
          category: lobby.category as "national" | "local",
          petitionCategory: lobby.petitionCategory ?? undefined,
          limit: (input.limit ?? 5) + 1,
        });
        return all.filter(l => l.id !== input.lobbyId).slice(0, input.limit ?? 5);
      }),
  }),

  // ─── Plebiscitos de Lobby ─────────────────────────────────────────────────────
  plebiscites: router({
    // Ativar plebiscito para um lobby (requer 5000 apoios)
    activate: protectedProcedure
      .input(z.object({ lobbyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const lobby = await db.getLobbyById(input.lobbyId);
        if (!lobby) throw new Error("Lobby não encontrado.");
        if (lobby.supportCount < 5000) {
          throw new Error(`Este lobby precisa de 5.000 apoios para ativar um plebiscito. Atualmente tem ${lobby.supportCount} apoios.`);
        }
        const existing = await db.getActivePlebisciteByLobby(input.lobbyId);
        if (existing) throw new Error("Já existe um plebiscito ativo para este lobby.");
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

    // Votar em um plebiscito de lobby
    vote: protectedProcedure
      .input(z.object({ plebisciteId: z.number(), vote: z.enum(["yes", "no"]) }))
      .mutation(async ({ ctx, input }) => {
        const plebiscite = await db.getLobbyPlebisciteById(input.plebisciteId);
        if (!plebiscite) throw new Error("Plebiscito não encontrado.");
        if (plebiscite.status !== "active") throw new Error("Este plebiscito não está mais ativo.");
        if (new Date() > plebiscite.endsAt) throw new Error("O prazo de votação encerrou.");
        const alreadyVoted = await db.hasUserVotedPlebiscite(input.plebisciteId, ctx.user.id);
        if (alreadyVoted) throw new Error("Você já votou neste plebiscito.");
        await db.castPlebisciteVote(input.plebisciteId, ctx.user.id, input.vote);
        const result = await db.getLobbyPlebisciteById(input.plebisciteId);
        return { success: true, yesVotes: result?.yesVotes ?? 0, noVotes: result?.noVotes ?? 0 };
      }),

    // Buscar plebiscito de um lobby
    byLobby: publicProcedure
      .input(z.object({ lobbyId: z.number() }))
      .query(({ input }) => db.getPlebisciteByLobby(input.lobbyId)),

    // Verificar se usuário já votou
    hasVoted: protectedProcedure
      .input(z.object({ plebisciteId: z.number() }))
      .query(({ ctx, input }) => db.hasUserVotedPlebiscite(input.plebisciteId, ctx.user.id)),
  }),

  // ─── Plebiscitos Nacionais ───────────────────────────────────────────────────────
  nationalPlebiscites: router({
    // Listar plebiscitos nacionais ativos
    list: publicProcedure
      .input(z.object({ status: z.enum(["active", "closed", "sent_to_chamber"]).optional() }).optional())
      .query(({ input }) => db.getNationalPlebiscites(input?.status)),

    // Buscar por ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getNationalPlebisciteById(input.id)),

    // Votar em plebiscito nacional
    vote: protectedProcedure
      .input(z.object({ plebisciteId: z.number(), vote: z.enum(["yes", "no"]) }))
      .mutation(async ({ ctx, input }) => {
        const plebiscite = await db.getNationalPlebisciteById(input.plebisciteId);
        if (!plebiscite) throw new Error("Plebiscito não encontrado.");
        if (plebiscite.status !== "active") throw new Error("Este plebiscito não está mais ativo.");
        const alreadyVoted = await db.hasUserVotedNationalPlebiscite(input.plebisciteId, ctx.user.id);
        if (alreadyVoted) throw new Error("Você já votou neste plebiscito.");
        const userProfile = await db.getUserProfile(ctx.user.id);
        await db.castNationalPlebisciteVote(input.plebisciteId, ctx.user.id, input.vote, userProfile?.state ?? undefined);
        const result = await db.getNationalPlebisciteById(input.plebisciteId);
        return { success: true, yesVotes: result?.yesVotes ?? 0, noVotes: result?.noVotes ?? 0 };
      }),

    // Verificar se usuário já votou
    hasVoted: protectedProcedure
      .input(z.object({ plebisciteId: z.number() }))
      .query(({ ctx, input }) => db.hasUserVotedNationalPlebiscite(input.plebisciteId, ctx.user.id)),

    // Enviar resultado à Câmara (gera relatório via IA)
    sendToChamber: protectedProcedure
      .input(z.object({ plebisciteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const plebiscite = await db.getNationalPlebisciteById(input.plebisciteId);
        if (!plebiscite) throw new Error("Plebiscito não encontrado.");
        const totalVotes = plebiscite.yesVotes + plebiscite.noVotes;
        const yesPercent = totalVotes > 0 ? Math.round((plebiscite.yesVotes / totalVotes) * 100) : 0;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é o Assistente Populus. Gere um ofício formal de manifestação popular para a Câmara dos Deputados. Responda em português do Brasil." },
            { role: "user", content: `Gere um ofício formal para a Câmara dos Deputados comunicando o resultado do seguinte plebiscito popular:\n\nTítulo: ${plebiscite.title}\nDescrição: ${plebiscite.description}\nTotal de votos: ${totalVotes}\nA favor: ${plebiscite.yesVotes} (${yesPercent}%)\nContra: ${plebiscite.noVotes} (${100 - yesPercent}%)\n\nO ofício deve ser formal, citar a Constituição Federal (Art. 14 - soberania popular) e solicitar que a Câmara considere a manifestação popular em suas deliberações.` },
          ],
        });
        await db.markNationalPlebisciteSentToChamber(input.plebisciteId);
        return { success: true, officialLetter: response.choices[0].message.content as string };
      }),

    // Resultados por estado
    resultsByState: publicProcedure
      .input(z.object({ plebisciteId: z.number() }))
      .query(({ input }) => db.getNationalPlebisciteVotesByState(input.plebisciteId)),
  }),

  // ─── Métricas de Poder Popular ────────────────────────────────────────────────────
  powerMetrics: router({
    get: publicProcedure.query(() => db.getPowerMetrics()),
  }),

  congress: router({
    // Buscar projetos de lei por palavra-chave
    searchBills: publicProcedure
      .input(z.object({ keyword: z.string().min(2), year: z.number().optional() }))
      .query(async ({ input }) => {
        const bills = await congressApi.searchAllBills(input.keyword);
        if (bills.length === 0) return congressApi.getFallbackBills(input.keyword);
        return bills;
      }),

    // Votações próximas
    upcomingVotes: publicProcedure
      .query(async () => {
        const votes = await congressApi.getUpcomingVotesCamara();
        if (votes.length === 0) return congressApi.getFallbackUpcomingVotes();
        return votes;
      }),

    // Deputados por estado/partido
    deputies: publicProcedure
      .input(z.object({ state: z.string().max(2).optional(), party: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const deputies = await congressApi.getDeputies(input?.state, input?.party);
        if (deputies.length === 0) return congressApi.getFallbackDeputies(input?.state);
        return deputies;
      }),

    // Histórico de votações de um deputado
    deputyVotingHistory: publicProcedure
      .input(z.object({ deputyId: z.string() }))
      .query(async ({ input }) => {
        if (input.deputyId.startsWith("dep-")) return [];
        return congressApi.getDeputyVotingHistory(input.deputyId);
      }),

    // Comissões parlamentares
    committees: publicProcedure
      .query(async () => {
        const committees = await congressApi.getCommittees();
        if (committees.length === 0) return congressApi.getFallbackCommittees();
        return committees;
      }),

    // Frentes parlamentares
    fronts: publicProcedure
      .query(async () => {
        const fronts = await congressApi.getParliamentaryFronts();
        if (fronts.length === 0) return congressApi.getFallbackParliamentaryFronts();
        return fronts;
      }),

    // Análise de transparência de um parlamentar via IA
    transparencyReport: publicProcedure
      .input(z.object({
        deputyName: z.string(),
        deputyParty: z.string(),
        deputyState: z.string(),
        lobbyCategory: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é o Assistente Populus, especialista em transparência parlamentar brasileira. Analise o perfil do parlamentar e gere um relatório de transparência. Responda em português do Brasil com JSON válido." },
            { role: "user", content: `Gere um relatório de transparência para:\n\nParlamentar: ${input.deputyName}\nPartido: ${input.deputyParty}\nEstado: ${input.deputyState}\nCategoria de interesse: ${input.lobbyCategory || "Geral"}\n\nForneça JSON com: receptivityScore (0-100), votingAlignment (string), keyVotes (array de {bill, vote, date}), recommendations (array de strings), overallAssessment (string), contactTips (array de strings).` },
          ],
          response_format: { type: "json_object" },
        });
        return JSON.parse(response.choices[0].message.content as string);
      }),

    // Senadores por estado
    senators: publicProcedure
      .input(z.object({ state: z.string().max(2).optional() }).optional())
      .query(async ({ input }) => {
        const senators = await congressApi.getSenators(input?.state);
        if (senators.length === 0) return congressApi.getFallbackSenators(input?.state);
        return senators;
      }),

    // Alertas inteligentes sobre pauta do Congresso via IA
    alerts: publicProcedure
      .input(z.object({ lobbyTitle: z.string(), lobbyCategory: z.string().optional() }))
      .query(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é o Assistente Populus. Gere alertas sobre a agenda do Congresso relacionados ao tema. Responda em português do Brasil com JSON válido." },
            { role: "user", content: `Gere alertas de oportunidade para:\n\nTema: ${input.lobbyTitle}\nCategoria: ${input.lobbyCategory || "Geral"}\n\nForneça JSON com: alerts (array de {type: 'vote'|'hearing'|'committee'|'opportunity', title, date, description, urgency: 'low'|'medium'|'high', action}).` },
          ],
          response_format: { type: "json_object" },
        });
        return JSON.parse(response.choices[0].message.content as string);
      }),
  }),

  // ─── Gamification ────────────────────────────────────────────────────────────
  gamification: router({
    // Resumo de pontos e nível do usuário autenticado
    myStats: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user.id;
        const totalPoints = await db.getUserPointsTotal(userId);
        const level = db.getLevelForPoints(totalPoints);
        const nextLevel = db.CITIZEN_LEVELS.find(l => l.level === level.level + 1) ?? null;
        const achievements = await db.getUserAchievements(userId);
        const history = await db.getUserPointsHistory(userId, 10);
        const progressToNext = nextLevel
          ? Math.min(100, Math.round(((totalPoints - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100))
          : 100;
        return { totalPoints, level, nextLevel, progressToNext, achievements, history };
      }),

    // Pontos de um usuário público
    userStats: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const totalPoints = await db.getUserPointsTotal(input.userId);
        const level = db.getLevelForPoints(totalPoints);
        const achievements = await db.getUserAchievements(input.userId);
        return { totalPoints, level, achievements };
      }),

    // Ranking dos cidadãos mais ativos
    leaderboard: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
      .query(async ({ input }) => db.getGamificationLeaderboard(input?.limit ?? 10)),

    // Registrar compartilhamento de card (+5 pontos)
    trackShare: protectedProcedure
      .input(z.object({ lobbyId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.awardPoints(ctx.user.id, "share_card", input.lobbyId, "Compartilhou card");
        const newAchievements = await db.checkAndUnlockAchievements(ctx.user.id);
        return { ...result, newAchievements };
      }),
  }),

  // ─── Moderation ─────────────────────────────────────────────────────
  moderation: router({
    // Verificar se usuário pode moderar
    canModerate: protectedProcedure
      .query(async ({ ctx }) => {
        const totalPoints = await db.getUserPointsTotal(ctx.user.id);
        const level = db.getLevelForPoints(totalPoints);
        return {
          canModerate: ctx.user.role === "admin" || ctx.user.role === "moderator" || level.level >= 4,
          role: ctx.user.role,
          level: level.level,
        };
      }),

    // Fila de moderação
    queue: protectedProcedure
      .input(z.object({
        status: z.enum(["pending", "approved", "rejected", "escalated"]).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        const totalPoints = await db.getUserPointsTotal(ctx.user.id);
        const level = db.getLevelForPoints(totalPoints);
        if (ctx.user.role !== "admin" && ctx.user.role !== "moderator" && level.level < 4) {
          throw new Error("Acesso negado: apenas moderadores e Líderes Comunitários (nível 4+) podem acessar a fila");
        }
        const items = await db.getModerationQueue(input ?? {});
        return Promise.all(items.map(async (item) => {
          const user = await db.getUserById(item.userId);
          const reviewer = item.reviewedBy ? await db.getUserById(item.reviewedBy) : null;
          return {
            ...item,
            aiFlags: item.aiFlags ? JSON.parse(item.aiFlags) : [],
            userName: user?.name ?? "Usuário",
            reviewerName: reviewer?.name ?? null,
          };
        }));
      }),

    // Estatísticas da fila
    stats: protectedProcedure
      .query(async ({ ctx }) => {
        const totalPoints = await db.getUserPointsTotal(ctx.user.id);
        const level = db.getLevelForPoints(totalPoints);
        if (ctx.user.role !== "admin" && ctx.user.role !== "moderator" && level.level < 4) {
          throw new Error("Acesso negado");
        }
        return db.getModerationStats();
      }),

    // Revisar item
    review: protectedProcedure
      .input(z.object({
        queueId: z.number(),
        action: z.enum(["approve", "reject", "escalate", "request_edit"]),
        note: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const totalPoints = await db.getUserPointsTotal(ctx.user.id);
        const level = db.getLevelForPoints(totalPoints);
        if (ctx.user.role !== "admin" && ctx.user.role !== "moderator" && level.level < 4) {
          throw new Error("Acesso negado");
        }
        await db.reviewModerationItem({
          queueId: input.queueId,
          moderatorId: ctx.user.id,
          action: input.action,
          note: input.note,
        });
        const item = await db.getModerationQueueItem(input.queueId);
        if (item && item.contentType === "lobby") {
          if (input.action === "approve") await db.updateLobbyStatus(item.contentId, "active");
          else if (input.action === "reject") await db.updateLobbyStatus(item.contentId, "rejected");
        }
        return { success: true };
      }),

    // Denunciar conteúdo
    report: protectedProcedure
      .input(z.object({
        contentType: z.enum(["lobby", "post", "comment", "user"]),
        contentId: z.number(),
        reason: z.enum(["hate_speech", "criminal_content", "fake_news", "spam", "harassment", "other"]),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const reportId = await db.createContentReport({ reporterId: ctx.user.id, ...input });
        return { reportId };
      }),
  }),

  // ─── Privacy (LGPD) ─────────────────────────────────────────────────────────
  privacy: router({
    getSettings: protectedProcedure
      .query(async ({ ctx }) => {
        const settings = await db.getPrivacySettings(ctx.user.id);
        return settings ?? await db.getDefaultPrivacySettings();
      }),

    updateSettings: protectedProcedure
      .input(z.object({
        profileVisibility: z.enum(["public", "followers", "private"]).optional(),
        showLocation: z.boolean().optional(),
        showActivity: z.boolean().optional(),
        showPoints: z.boolean().optional(),
        allowAnonymous: z.boolean().optional(),
        anonymousAlias: z.string().max(50).optional(),
        dataConsentAt: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const data: Parameters<typeof db.upsertPrivacySettings>[1] = {};
        if (input.profileVisibility !== undefined) data.profileVisibility = input.profileVisibility;
        if (input.showLocation !== undefined) data.showLocation = input.showLocation;
        if (input.showActivity !== undefined) data.showActivity = input.showActivity;
        if (input.showPoints !== undefined) data.showPoints = input.showPoints;
        if (input.allowAnonymous !== undefined) data.allowAnonymous = input.allowAnonymous;
        if (input.anonymousAlias !== undefined) data.anonymousAlias = input.anonymousAlias;
        if (input.dataConsentAt === true) data.dataConsentAt = new Date();
        await db.upsertPrivacySettings(ctx.user.id, data);
        return { success: true };
      }),

    exportData: protectedProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user.id;
        const [user, profile, settings, points, achievements] = await Promise.all([
          db.getUserById(userId),
          db.getUserProfile(userId),
          db.getPrivacySettings(userId),
          db.getUserPointsHistory(userId, 1000),
          db.getUserAchievements(userId),
        ]);
        return {
          exportedAt: new Date().toISOString(),
          user: { id: user?.id, name: user?.name, email: user?.email, createdAt: user?.createdAt },
          profile,
          privacySettings: settings,
          points,
          achievements,
          notice: "Dados exportados conforme LGPD — Art. 18, inciso V.",
        };
      }),
  }),

  // ─── Press / Journalists ──────────────────────────────────────────────────
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

    listAlerts: protectedProcedure
      .input(z.object({ lobbyId: z.number() }))
      .query(async ({ input }) => {
        return db.getPressAlertsByLobby(input.lobbyId);
      }),
  }),

  // ─── Citizen Feed ─────────────────────────────────────────────────────────────
  citizenFeed: router({
    // Posts com coordenadas para o mapa (público)
    forMap: publicProcedure
      .query(async () => {
        return db.getCitizenPostsForMap();
      }),
    // Listar posts do feed (público)
    list: publicProcedure
      .input(z.object({
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0),
        category: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const viewerUserId = ctx.user?.id;
        return db.getCitizenFeed({ ...input, viewerUserId });
      }),

    // Criar post (autenticado)
    create: protectedProcedure
      .input(z.object({
        content: z.string().min(1).max(2000),
        mediaUrls: z.array(z.string().url()).max(5).default([]),
        mediaTypes: z.array(z.enum(["image", "video"])).max(5).default([]),
        category: z.string().default("other"),
        locationAddress: z.string().max(500).optional(),
        locationCity: z.string().max(100).optional(),
        locationState: z.string().max(2).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const postId = await db.createCitizenPost({ userId: ctx.user.id, ...input });
        return { success: true, postId };
      }),

    // Curtir/descurtir post (autenticado)
    like: protectedProcedure
      .input(z.object({ postId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.toggleCitizenPostLike(input.postId, ctx.user.id);
        // Send push notification to post author (only when liking, not unliking)
        if (result.liked) {
          const authorId = await db.getCitizenPostAuthorId(input.postId);
          if (authorId && authorId !== ctx.user.id) {
            const tokens = await db.getPushTokensForUsers([authorId]);
            const likerName = ctx.user.name ?? "Alguém";
            for (const { token } of tokens) {
              sendPushToUser(token, "Nova curtida ❤️", `${likerName} curtiu sua denúncia`, {
                url: `/feed/${input.postId}`,
                type: "like",
                postId: input.postId,
              }).catch(() => {}); // fire-and-forget
            }
          }
        }
        return result;
      }),
    // Comentar em post (autenticado)
    comment: protectedProcedure
      .input(z.object({ postId: z.number().int(), content: z.string().min(1).max(500) }))
      .mutation(async ({ ctx, input }) => {
        const commentId = await db.addCitizenPostComment(input.postId, ctx.user.id, input.content);
        // Send push notification to post author
        const authorId = await db.getCitizenPostAuthorId(input.postId);
        if (authorId && authorId !== ctx.user.id) {
          const tokens = await db.getPushTokensForUsers([authorId]);
          const commenterName = ctx.user.name ?? "Alguém";
          for (const { token } of tokens) {
            sendPushToUser(token, "Novo comentário 💬", `${commenterName} comentou na sua denúncia`, {
              url: `/feed/${input.postId}`,
              type: "comment",
              postId: input.postId,
              commentId,
            }).catch(() => {}); // fire-and-forget
          }
        }
        return { success: true, commentId };
      }),
    // Listar comentários de um postt
    comments: publicProcedure
      .input(z.object({ postId: z.number().int() }))
      .query(async ({ input }) => {
        return db.getCitizenPostComments(input.postId);
      }),

    // Posts por usuário específico
    byUser: publicProcedure
      .input(z.object({ userId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const viewerUserId = ctx.user?.id;
        return db.getCitizenPostsByUser(input.userId, viewerUserId);
      }),

    // Post por ID (detalhe)
    getById: publicProcedure
      .input(z.object({ postId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const viewerUserId = ctx.user?.id;
        return db.getCitizenPostById(input.postId, viewerUserId);
      }),

    // Deletar post (autenticado, apenas o autor)
    delete: protectedProcedure
      .input(z.object({ postId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const deleted = await db.deleteCitizenPost(input.postId, ctx.user.id);
        return { success: deleted };
      }),

    // Upload de mídia para S3
    uploadMedia: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.base64, "base64");
        const key = `citizen-feed/${ctx.user.id}/${Date.now()}-${input.fileName}`;
        const result = await storagePut(key, buffer, input.mimeType);
        return { url: result.url };
      }),
  }),

  // ─── Invite Codes ──────────────────────────────────────────────────────────
  invite: router({
    // Validar código de convite (público)
    validate: publicProcedure
      .input(z.object({ code: z.string().min(1) }))
      .query(async ({ input }) => {
        return db.validateInviteCode(input.code.trim().toUpperCase());
      }),

    // Usar código de convite após login (autenticado)
    use: protectedProcedure
      .input(z.object({ code: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const validation = await db.validateInviteCode(input.code.trim().toUpperCase());
        if (!validation.valid) throw new Error(validation.reason ?? "Código inválido");
        const used = await db.useInviteCode(input.code.trim().toUpperCase(), ctx.user.id);
        return { success: used };
      }),

    // Criar código de convite (apenas admin/moderador)
    create: protectedProcedure
      .input(z.object({
        code: z.string().min(4).max(32).optional(),
        maxUses: z.number().int().min(1).max(1000).default(1),
        expiresInDays: z.number().int().min(1).max(365).optional(),
        description: z.string().max(200).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "moderator") {
          throw new Error("Apenas administradores podem criar códigos de convite");
        }
        const code = input.code?.toUpperCase() ??
          Math.random().toString(36).substring(2, 10).toUpperCase();
        const expiresAt = input.expiresInDays
          ? new Date(Date.now() + input.expiresInDays * 86400000)
          : undefined;
        await db.createInviteCode({
          code,
          createdBy: ctx.user.id,
          maxUses: input.maxUses,
          expiresAt,
          description: input.description,
        });
        return { code };
      }),

    // Listar códigos (apenas admin/moderador)
    list: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "moderator") {
          throw new Error("Acesso negado");
        }
        return db.listInviteCodes();
      }),

    // Desativar código (apenas admin/moderador)
    deactivate: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "moderator") {
          throw new Error("Acesso negado");
        }
        await db.deactivateInviteCode(input.code.toUpperCase());
        return { success: true };
      }),
  }),

  // ─── Push Notification Tokens ──────────────────────────────────────────────
  pushTokens: router({
    // Registrar ou atualizar token de push do dispositivo
    register: protectedProcedure
      .input(z.object({
        token: z.string().min(1),
        platform: z.enum(["expo", "apns", "fcm"]).default("expo"),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertPushToken(ctx.user.id, input.token, input.platform);
        return { success: true };
      }),
    // Remover token ao fazer logout
    unregister: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.deletePushToken(ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Contact / Interest Submissions ──────────────────────────────────────────────
  contact: router({
    // Enviar formulário de interesse / contato
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
    // Listar submissões (admin)
    list: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "moderator") {
          throw new Error("Acesso negado");
        }
        return db.listContactSubmissions(100, 0);
      }),
  }),
});
export type AppRouter = typeof appRouter;
