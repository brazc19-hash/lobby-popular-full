import { and, desc, eq, gte, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertCommunity,
  InsertForumComment,
  InsertForumPost,
  InsertLobby,
  InsertUser,
  InsertUserInteraction,
  activityFeed,
  channelMessages,
  communityChannels,
  communities,
  communityLobbyAlliances,
  communityMembers,
  constitutionArticles,
  directMessages,
  forumComments,
  forumPosts,
  lobbies,
  lobbyMilestones,
  lobbySupports,
  lobbyTimeline,
  newsItems,
  userFollows,
  userInteractions,
  userPreferences,
  userProfiles,
  users,
  pressureActions,
  smartMilestones,
  lobbyPlebiscites,
  plebisciteVotes,
  nationalPlebiscites,
  nationalPlebisciteVotes,
  powerMetrics,
  InsertLobbyPlebiscite,
  InsertNationalPlebiscite,
  userPoints,
  userAchievements,
  moderationQueue,
  moderationLogs,
  privacySettings,
  contentReports,
  pressJournalists,
  pressAlerts,
  citizenPosts,
  citizenPostLikes,
  citizenPostComments,
  inviteCodes,
  pushTokens,
  contactSubmissions,
  InsertContactSubmission,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ─────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized as string | undefined;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Constitution Articles ──────────────────────────────────────────────────────

export async function getConstitutionArticles(search?: string) {
  const db = await getDb();
  if (!db) return [];
  if (search) {
    return db.select().from(constitutionArticles).where(
      or(
        like(constitutionArticles.title, `%${search}%`),
        like(constitutionArticles.summary, `%${search}%`),
        like(constitutionArticles.articleNumber, `%${search}%`),
        like(constitutionArticles.theme, `%${search}%`)
      )
    ).orderBy(constitutionArticles.articleNumber);
  }
  return db.select().from(constitutionArticles).orderBy(constitutionArticles.articleNumber);
}

export async function getConstitutionArticleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(constitutionArticles).where(eq(constitutionArticles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Lobbies ────────────────────────────────────────────────────────────────────

export async function getLobbies(opts?: {
  category?: "national" | "local";
  petitionCategory?: string;
  status?: string;
  search?: string;
  state?: string;
  city?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.category) conditions.push(eq(lobbies.category, opts.category));
  if (opts?.petitionCategory) conditions.push(eq(lobbies.petitionCategory, opts.petitionCategory as "infrastructure" | "education" | "health" | "security" | "environment" | "human_rights" | "economy" | "transparency" | "culture"));
  if (opts?.status) conditions.push(eq(lobbies.status, opts.status as "pending" | "active" | "rejected" | "closed"));
  if (opts?.search) conditions.push(or(like(lobbies.title, `%${opts.search}%`), like(lobbies.description, `%${opts.search}%`)));
  if (opts?.state) conditions.push(eq(lobbies.locationState, opts.state));
  if (opts?.city) conditions.push(like(lobbies.locationCity, `%${opts.city}%`));
  const query = db.select().from(lobbies)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(lobbies.createdAt))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);
  return query;
}

export async function getLobbyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lobbies).where(eq(lobbies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPriorityAgendaLobbies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lobbies).where(
    and(
      eq(lobbies.isPriorityAgenda, true),
      eq(lobbies.status, "active")
    )
  ).orderBy(desc(lobbies.priorityAgendaUntil)).limit(5);
}

export async function getLocalLobbiesWithCoords() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lobbies).where(
    and(eq(lobbies.category, "local"), eq(lobbies.status, "active"))
  );
}

export async function createLobby(data: InsertLobby) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(lobbies).values(data);
  return result[0].insertId;
}

export async function updateLobbyStatus(id: number, status: "pending" | "active" | "rejected" | "closed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(lobbies).set({ status }).where(eq(lobbies.id, id));
}

export async function incrementLobbyView(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(lobbies).set({ viewCount: sql`${lobbies.viewCount} + 1` }).where(eq(lobbies.id, id));
}

// ─── Lobby Supports ─────────────────────────────────────────────────────────────

export async function supportLobby(lobbyId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(lobbySupports)
    .where(and(eq(lobbySupports.lobbyId, lobbyId), eq(lobbySupports.userId, userId))).limit(1);
  if (existing.length > 0) return { alreadySupported: true };
  await db.insert(lobbySupports).values({ lobbyId, userId });
  await db.update(lobbies).set({ supportCount: sql`${lobbies.supportCount} + 1` }).where(eq(lobbies.id, lobbyId));
  return { alreadySupported: false };
}

export async function unsupportLobby(lobbyId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(lobbySupports)
    .where(and(eq(lobbySupports.lobbyId, lobbyId), eq(lobbySupports.userId, userId))).limit(1);
  if (existing.length === 0) return { wasSupported: false };
  await db.delete(lobbySupports).where(and(eq(lobbySupports.lobbyId, lobbyId), eq(lobbySupports.userId, userId)));
  await db.update(lobbies).set({ supportCount: sql`GREATEST(${lobbies.supportCount} - 1, 0)` }).where(eq(lobbies.id, lobbyId));
  return { wasSupported: true };
}

export async function getUserLobbySupports(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lobbySupports).where(eq(lobbySupports.userId, userId));
}

export async function isUserSupporting(lobbyId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(lobbySupports)
    .where(and(eq(lobbySupports.lobbyId, lobbyId), eq(lobbySupports.userId, userId))).limit(1);
  return result.length > 0;
}

// ─── Communities ────────────────────────────────────────────────────────────────

export async function getCommunities(search?: string) {
  const db = await getDb();
  if (!db) return [];
  if (search) {
    return db.select().from(communities).where(
      or(like(communities.name, `%${search}%`), like(communities.theme, `%${search}%`))
    ).orderBy(desc(communities.memberCount));
  }
  return db.select().from(communities).orderBy(desc(communities.memberCount));
}

export async function getCommunityById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(communities).where(eq(communities.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCommunity(data: InsertCommunity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(communities).values(data);
  const communityId = result[0].insertId;
  await db.insert(communityMembers).values({ communityId, userId: data.creatorId, role: "admin" });
  return communityId;
}

export async function joinCommunity(communityId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(communityMembers)
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId))).limit(1);
  if (existing.length > 0) return { alreadyMember: true };
  await db.insert(communityMembers).values({ communityId, userId });
  await db.update(communities).set({ memberCount: sql`${communities.memberCount} + 1` }).where(eq(communities.id, communityId));
  return { alreadyMember: false };
}

export async function leaveCommunity(communityId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
  await db.update(communities).set({ memberCount: sql`GREATEST(${communities.memberCount} - 1, 0)` }).where(eq(communities.id, communityId));
}

export async function isCommunityMember(communityId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(communityMembers)
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId))).limit(1);
  return result.length > 0;
}

export async function getCommunityMembers(communityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityMembers).where(eq(communityMembers.communityId, communityId));
}

// ─── Community Lobby Alliances ──────────────────────────────────────────────────

export async function allyLobby(communityId: number, lobbyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(communityLobbyAlliances)
    .where(and(eq(communityLobbyAlliances.communityId, communityId), eq(communityLobbyAlliances.lobbyId, lobbyId))).limit(1);
  if (existing.length > 0) return;
  await db.insert(communityLobbyAlliances).values({ communityId, lobbyId });
}

export async function getCommunityAlliances(communityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityLobbyAlliances).where(eq(communityLobbyAlliances.communityId, communityId));
}

export async function getLobbyAlliances(lobbyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityLobbyAlliances).where(eq(communityLobbyAlliances.lobbyId, lobbyId));
}

// ─── Forum Posts ────────────────────────────────────────────────────────────────

export async function getForumPosts(communityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(forumPosts).where(eq(forumPosts.communityId, communityId)).orderBy(desc(forumPosts.isPinned), desc(forumPosts.createdAt));
}

export async function getForumPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(forumPosts).where(eq(forumPosts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createForumPost(data: InsertForumPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(forumPosts).values(data);
  return result[0].insertId;
}

// ─── Forum Comments ─────────────────────────────────────────────────────────────

export async function getForumComments(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(forumComments).where(eq(forumComments.postId, postId)).orderBy(forumComments.createdAt);
}

export async function createForumComment(data: InsertForumComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(forumComments).values(data);
  await db.update(forumPosts).set({ commentCount: sql`${forumPosts.commentCount} + 1` }).where(eq(forumPosts.id, data.postId));
  return result[0].insertId;
}

// ─── News Items ─────────────────────────────────────────────────────────────────

export async function getNewsItems(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(newsItems).orderBy(desc(newsItems.publishedAt)).limit(limit);
}

// ─── Seed Data ──────────────────────────────────────────────────────────────────

export async function seedData() {
  const db = await getDb();
  if (!db) return;

  // Check if already seeded
  const existingArticles = await db.select().from(constitutionArticles).limit(1);
  if (existingArticles.length > 0) return;

  // Seed Constitution Articles
  await db.insert(constitutionArticles).values([
    { articleNumber: "Art. 5º", title: "Direitos e Garantias Fundamentais", theme: "Direitos Fundamentais", summary: "Todos são iguais perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade.", fullText: "Art. 5º Todos são iguais perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade, nos termos seguintes: I - homens e mulheres são iguais em direitos e obrigações, nos termos desta Constituição; II - ninguém será obrigado a fazer ou deixar de fazer alguma coisa senão em virtude de lei..." },
    { articleNumber: "Art. 6º", title: "Direitos Sociais", theme: "Direitos Sociais", summary: "São direitos sociais a educação, a saúde, a alimentação, o trabalho, a moradia, o transporte, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados.", fullText: "Art. 6º São direitos sociais a educação, a saúde, a alimentação, o trabalho, a moradia, o transporte, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados, na forma desta Constituição." },
    { articleNumber: "Art. 37", title: "Administração Pública", theme: "Administração Pública", summary: "A administração pública direta e indireta de qualquer dos Poderes da União, dos Estados, do Distrito Federal e dos Municípios obedecerá aos princípios de legalidade, impessoalidade, moralidade, publicidade e eficiência.", fullText: "Art. 37. A administração pública direta e indireta de qualquer dos Poderes da União, dos Estados, do Distrito Federal e dos Municípios obedecerá aos princípios de legalidade, impessoalidade, moralidade, publicidade e eficiência e, também, ao seguinte: I - os cargos, empregos e funções públicas são acessíveis aos brasileiros que preencham os requisitos estabelecidos em lei..." },
    { articleNumber: "Art. 196", title: "Direito à Saúde", theme: "Saúde", summary: "A saúde é direito de todos e dever do Estado, garantido mediante políticas sociais e econômicas que visem à redução do risco de doença e de outros agravos e ao acesso universal e igualitário às ações e serviços para sua promoção, proteção e recuperação.", fullText: "Art. 196. A saúde é direito de todos e dever do Estado, garantido mediante políticas sociais e econômicas que visem à redução do risco de doença e de outros agravos e ao acesso universal e igualitário às ações e serviços para sua promoção, proteção e recuperação." },
    { articleNumber: "Art. 205", title: "Direito à Educação", theme: "Educação", summary: "A educação, direito de todos e dever do Estado e da família, será promovida e incentivada com a colaboração da sociedade, visando ao pleno desenvolvimento da pessoa, seu preparo para o exercício da cidadania e sua qualificação para o trabalho.", fullText: "Art. 205. A educação, direito de todos e dever do Estado e da família, será promovida e incentivada com a colaboração da sociedade, visando ao pleno desenvolvimento da pessoa, seu preparo para o exercício da cidadania e sua qualificação para o trabalho." },
    { articleNumber: "Art. 225", title: "Direito ao Meio Ambiente", theme: "Meio Ambiente", summary: "Todos têm direito ao meio ambiente ecologicamente equilibrado, bem de uso comum do povo e essencial à sadia qualidade de vida, impondo-se ao Poder Público e à coletividade o dever de defendê-lo e preservá-lo para as presentes e futuras gerações.", fullText: "Art. 225. Todos têm direito ao meio ambiente ecologicamente equilibrado, bem de uso comum do povo e essencial à sadia qualidade de vida, impondo-se ao Poder Público e à coletividade o dever de defendê-lo e preservá-lo para as presentes e futuras gerações." },
    { articleNumber: "Art. 182", title: "Política Urbana", theme: "Urbanismo", summary: "A política de desenvolvimento urbano, executada pelo Poder Público municipal, conforme diretrizes gerais fixadas em lei, tem por objetivo ordenar o pleno desenvolvimento das funções sociais da cidade e garantir o bem-estar de seus habitantes.", fullText: "Art. 182. A política de desenvolvimento urbano, executada pelo Poder Público municipal, conforme diretrizes gerais fixadas em lei, tem por objetivo ordenar o pleno desenvolvimento das funções sociais da cidade e garantir o bem-estar de seus habitantes." },
    { articleNumber: "Art. 144", title: "Segurança Pública", theme: "Segurança", summary: "A segurança pública, dever do Estado, direito e responsabilidade de todos, é exercida para a preservação da ordem pública e da incolumidade das pessoas e do patrimônio.", fullText: "Art. 144. A segurança pública, dever do Estado, direito e responsabilidade de todos, é exercida para a preservação da ordem pública e da incolumidade das pessoas e do patrimônio, através dos seguintes órgãos: I - polícia federal; II - polícia rodoviária federal; III - polícia ferroviária federal; IV - polícias civis; V - polícias militares e corpos de bombeiros militares." },
    { articleNumber: "Art. 170", title: "Ordem Econômica", theme: "Economia", summary: "A ordem econômica, fundada na valorização do trabalho humano e na livre iniciativa, tem por fim assegurar a todos existência digna, conforme os ditames da justiça social.", fullText: "Art. 170. A ordem econômica, fundada na valorização do trabalho humano e na livre iniciativa, tem por fim assegurar a todos existência digna, conforme os ditames da justiça social, observados os seguintes princípios: I - soberania nacional; II - propriedade privada; III - função social da propriedade..." },
    { articleNumber: "Art. 14", title: "Soberania Popular e Participação Política", theme: "Participação Política", summary: "A soberania popular será exercida pelo sufrágio universal e pelo voto direto e secreto, com valor igual para todos, e, nos termos da lei, mediante: plebiscito, referendo e iniciativa popular.", fullText: "Art. 14. A soberania popular será exercida pelo sufrágio universal e pelo voto direto e secreto, com valor igual para todos, e, nos termos da lei, mediante: I - plebiscito; II - referendo; III - iniciativa popular." },
  ]);

  // Get article IDs
  const articles = await db.select().from(constitutionArticles);
  const art37 = articles.find(a => a.articleNumber === "Art. 37")!;
  const art182 = articles.find(a => a.articleNumber === "Art. 182")!;
  const art196 = articles.find(a => a.articleNumber === "Art. 196")!;

  // Create a system user for seed data
  const seedUserResult = await db.insert(users).values({
    openId: "seed_system_user",
    name: "Cidadão Exemplo",
    email: "cidadao@exemplo.com.br",
    role: "user",
    loginMethod: "oauth",
    lastSignedIn: new Date(),
  }).onDuplicateKeyUpdate({ set: { name: "Cidadão Exemplo" } });
  
  const seedUsers = await db.select().from(users).where(eq(users.openId, "seed_system_user")).limit(1);
  const seedUserId = seedUsers[0]?.id ?? 1;

  // Get more article IDs
  const art5 = articles.find(a => a.articleNumber === "Art. 5º")!;
  const art6 = articles.find(a => a.articleNumber === "Art. 6º")!;
  const art205 = articles.find(a => a.articleNumber === "Art. 205")!;
  const art225 = articles.find(a => a.articleNumber === "Art. 225")!;
  const art144 = articles.find(a => a.articleNumber === "Art. 144")!;

  // Seed Lobbies (rich demo data)
  await db.insert(lobbies).values([
    {
      userId: seedUserId,
      title: "Merenda Escolar de Qualidade nas Escolas Públicas",
      description: "Dados do FNDE mostram que 30% das escolas públicas brasileiras servem merenda abaixo dos padrões nutricionais mínimos. Crianças em situação de vulnerabilidade dependem dessa refeição como principal fonte de alimentação do dia. Uma mãe de Minas Gerais iniciou esta campanha após descobrir que a escola de seu filho servia apenas biscoito e achocolatado como almoço.",
      objective: "Pressionar o MEC e deputados estaduais para aprovar lei que garanta cardápio nutricional mínimo com proteína, vegetais e fruta em todas as refeições escolares da rede pública, com fiscalização trimestral.",
      category: "national",
      status: "active",
      constitutionArticleId: art6.id,
      petitionCategory: "education",
      goalCount: 50000,
      lobbyStatus: "pressure",
      supportCount: 47823,
      viewCount: 189400,
      isPriorityAgenda: true,
      targetParlamentarians: JSON.stringify(["Dep. Maria Silva (PT-MG)", "Dep. João Santos (PSDB-SP)", "Sen. Ana Costa (PDT-RJ)"]),
    },
    {
      userId: seedUserId,
      title: "Iluminação Pública na Rua Esperança — Bairro Vila Nova",
      description: "A Rua Esperança está sem iluminação pública há 8 meses após um incêndio destruir a fiação elétrica. O bairro registrou 12 assaltos e 2 atropelamentos no período. Moradores relatam medo de sair à noite. A Prefeitura foi notificada 3 vezes sem resposta.",
      objective: "Exigir que a Prefeitura Municipal restaure a iluminação pública na Rua Esperança, trecho entre os números 100 e 500, no prazo máximo de 30 dias, conforme Art. 6º da CF (direito à segurança).",
      category: "local",
      status: "active",
      constitutionArticleId: art6.id,
      petitionCategory: "infrastructure",
      goalCount: 500,
      lobbyStatus: "mobilization",
      latitude: "-19.9167",
      longitude: "-43.9345",
      locationAddress: "Rua Esperança, 100-500",
      locationCity: "Belo Horizonte",
      locationState: "MG",
      supportCount: 387,
      viewCount: 2140,
    },
    {
      userId: seedUserId,
      title: "Aumento de 15% na Verba Federal para o SUS",
      description: "O Sistema Único de Saúde opera com déficit de R$ 22 bilhões anuais. Resultado: 8,5 milhões de brasileiros aguardam cirurgias eletivas, 4,2 milhões esperam consultas especializadas há mais de 6 meses. O Art. 196 da Constituição garante saúde como direito de todos e dever do Estado — mas o orçamento atual não honra esse compromisso.",
      objective: "Pressionar o Congresso Nacional para aprovar emenda ao orçamento federal 2026 que aumente em 15% a verba destinada ao SUS, priorizando atenção básica, oncologia e saúde mental.",
      category: "national",
      status: "active",
      constitutionArticleId: art196.id,
      petitionCategory: "health",
      goalCount: 100000,
      lobbyStatus: "pressure",
      supportCount: 89340,
      viewCount: 321000,
      isPriorityAgenda: true,
      targetParlamentarians: JSON.stringify(["Dep. Carlos Mendes (MDB-SP)", "Sen. Roberta Lima (PT-BA)", "Dep. Paulo Ferreira (PL-RJ)"]),
    },
    {
      userId: seedUserId,
      title: "Reforma da Lei de Licitações — Fim do Superfaturamento",
      description: "A Lei nº 14.133/2021 ainda apresenta brechas que permitem superfaturamento em obras públicas. O TCU identificou irregularidades em 68% das obras federais auditadas em 2025, totalizando R$ 4,7 bilhões em prejuízo ao erário. Precisamos de mecanismos mais rigorosos de controle e participação cidadã.",
      objective: "Alterar a Lei nº 14.133/2021 para incluir: (1) publicação em tempo real de todos os contratos acima de R$ 100 mil; (2) comissão cidadã de fiscalização; (3) criminalização do superfaturamento acima de 10%.",
      category: "national",
      status: "active",
      constitutionArticleId: art37.id,
      petitionCategory: "transparency",
      goalCount: 200000,
      lobbyStatus: "processing",
      supportCount: 156780,
      viewCount: 892000,
      isPriorityAgenda: true,
      targetParlamentarians: JSON.stringify(["Dep. Fernanda Oliveira (PSOL-SP)", "Sen. Ricardo Barros (PP-PR)", "Dep. Marcelo Costa (PT-PE)"]),
    },
    {
      userId: seedUserId,
      title: "Ciclofaixa Permanente na Av. Brasil — Rio de Janeiro",
      description: "A Av. Brasil é a via com maior número de atropelamentos do Rio de Janeiro: 47 mortes em 2025. Ciclistas e pedestres disputam espaço com veículos pesados sem qualquer proteção. Cidades como São Paulo e Curitiba já implementaram ciclofaixas permanentes com redução de 60% nos acidentes.",
      objective: "Solicitar à Prefeitura do Rio de Janeiro a implantação de ciclofaixa permanente e calçada ampliada na Av. Brasil, trecho da Zona Norte, com sinalização adequada e iluminação LED.",
      category: "local",
      status: "active",
      constitutionArticleId: art182.id,
      petitionCategory: "infrastructure",
      goalCount: 10000,
      lobbyStatus: "mobilization",
      latitude: "-22.8905",
      longitude: "-43.2192",
      locationAddress: "Av. Brasil, Zona Norte",
      locationCity: "Rio de Janeiro",
      locationState: "RJ",
      supportCount: 7234,
      viewCount: 45600,
    },
    {
      userId: seedUserId,
      title: "Educação Ambiental Obrigatória nas Escolas Públicas",
      description: "O Brasil perde 400 mil hectares de Mata Atlântica por ano. Pesquisa do IBGE mostra que 73% dos jovens brasileiros não sabem identificar espécies nativas da sua região. A educação ambiental é a única forma de criar uma geração que proteja o meio ambiente por convicção, não por obrigação.",
      objective: "Incluir educação ambiental prática (hortas escolares, visitas a unidades de conservação, projetos de reciclagem) como disciplina obrigatória no currículo do ensino fundamental e médio das escolas públicas.",
      category: "national",
      status: "active",
      constitutionArticleId: art225.id,
      petitionCategory: "environment",
      goalCount: 30000,
      lobbyStatus: "mobilization",
      supportCount: 12456,
      viewCount: 67800,
    },
  ]);

  // Seed Communities (rich demo data)
  await db.insert(communities).values([
    {
      creatorId: seedUserId,
      name: "Mães pela Merenda",
      description: "Comunidade de mães, pais e educadores que lutam por alimentação escolar de qualidade. Já conquistamos melhorias em 47 municípios. Junte-se a nós!",
      theme: "Educação",
      memberCount: 5234,
    },
    {
      creatorId: seedUserId,
      name: "SUS Forte — Saúde para Todos",
      description: "Defendemos o fortalecimento do SUS e o direito constitucional à saúde de qualidade. Monitoramos votações, denunciamos cortes e pressionamos parlamentares. 8.500 membros ativos.",
      theme: "Saúde",
      memberCount: 8547,
    },
    {
      creatorId: seedUserId,
      name: "Transparência Brasil",
      description: "Monitoramos contratos públicos, denunciamos irregularidades e pressionamos por maior transparência nas licitações. Parceria com CGU e TCU. Mais de 200 denúncias registradas.",
      theme: "Administração Pública",
      memberCount: 3891,
    },
    {
      creatorId: seedUserId,
      name: "Mobilidade Urbana RJ",
      description: "Lutamos por ciclovias, calçadas acessíveis e segurança viária no Rio de Janeiro. Mapeamos pontos críticos e pressionamos a Prefeitura com dados concretos.",
      theme: "Urbanismo",
      memberCount: 2156,
    },
  ]);

  // Seed Community Channels and Posts
  const allCommunities = await db.select().from(communities).limit(4);
  for (const comm of allCommunities) {
    // Add channels
    await db.insert(communityChannels).values([
      { communityId: comm.id, name: "geral", slug: "geral", description: "Canal geral de discussão", isDefault: true, messageCount: 47 },
      { communityId: comm.id, name: "estratégia", slug: "estrategia", description: "Planejamento e estratégia de pressão", messageCount: 23 },
      { communityId: comm.id, name: "documentos", slug: "documentos", description: "Documentos, pesquisas e evidências", messageCount: 12 },
    ]);
    // Add forum posts
    const post1 = await db.insert(forumPosts).values({
      communityId: comm.id,
      userId: seedUserId,
      title: "📌 Bem-vindo(a) à comunidade! Leia antes de postar",
      content: "Olá a todos! Este é o espaço para organizar nossa ação coletiva. Regras: 1) Seja respeitoso(a); 2) Compartilhe fontes confiáveis; 3) Use @mencões para chamar atenção de membros específicos; 4) Reporte conteúdo inadequado. Juntos somos mais fortes! ✊",
      isPinned: true,
      commentCount: 8,
    });
    await db.insert(forumPosts).values({
      communityId: comm.id,
      userId: seedUserId,
      title: "📊 Atualização: Progresso da nossa campanha esta semana",
      content: "Boas notícias! Atingimos 75% da nossa meta de apoios. Três parlamentares já responderam nossas mensagens. O deputado Carlos Mendes pediu reunião para a próxima semana. Continuem pressionando! Cada mensagem enviada conta. 💪",
      isPinned: false,
      commentCount: 15,
    });
    await db.insert(forumPosts).values({
      communityId: comm.id,
      userId: seedUserId,
      title: "📚 Pesquisa: Dados que fortalecem nossa causa",
      content: "Compilei os principais dados para usar nas mensagens aos parlamentares:\n\n• Fonte: IBGE 2025\n• Número afetados: estimativa de 2,3 milhões de pessoas\n• Custo econômico: R$ 4,7 bilhões/ano\n• Países com solução implementada: Alemanha, Portugal, Chile\n\nUsem esses dados nas mensagens! São irrefutáveis.",
      isPinned: false,
      commentCount: 6,
    });
  }

  // Seed National Plebiscites
  const endsAt1 = new Date();
  endsAt1.setDate(endsAt1.getDate() + 30);
  const endsAt2 = new Date();
  endsAt2.setDate(endsAt2.getDate() + 45);
  await db.insert(nationalPlebiscites).values([
    {
      title: "Você apoia a criminalização do enriquecimento ilícito de funcionários públicos?",
      description: "Atualmente, o enriquecimento ilícito de servidores públicos não é crime autônomo no Brasil. Esta consulta popular questiona se a população apoia a criação de um tipo penal específico para punir funcionários públicos que acumulem patrimônio incompatível com seus rendimentos.",
      category: "Transparência e Anticorrupção",
      status: "active",
      yesVotes: 128743,
      noVotes: 12891,
      endsAt: endsAt1,
    },
    {
      title: "Você apoia o voto obrigatório para maiores de 16 anos?",
      description: "O Brasil possui voto obrigatório para maiores de 18 anos. Esta consulta questiona se o voto deve ser também obrigatório para jovens entre 16 e 17 anos, que hoje têm direito de votar mas não são obrigados.",
      category: "Participação Política",
      status: "active",
      yesVotes: 45231,
      noVotes: 89432,
      endsAt: endsAt2,
    },
  ]);

  // Seed Power Metrics
  await db.insert(powerMetrics).values({
    totalCitizens: 1000000,
    electoratePercent: "2.00",
    billsInfluenced: 15,
    victories: 7,
  });

  // Seed News
  await db.insert(newsItems).values([
    { title: "Câmara aprova projeto que aumenta transparência em contratos públicos", summary: "A Câmara dos Deputados aprovou em primeiro turno um projeto de lei que obriga a publicação em tempo real de todos os contratos firmados pelo governo federal, estadual e municipal.", source: "Agência Brasil", category: "Legislação", publishedAt: new Date("2026-02-20") },
    { title: "Senado debate PEC que garante piso mínimo para saúde nos municípios", summary: "Senadores debatem proposta de emenda constitucional que estabelece um piso mínimo de investimento em saúde para todos os municípios brasileiros, independente do porte.", source: "Senado Federal", category: "Saúde", publishedAt: new Date("2026-02-18") },
    { title: "Governo lança programa de melhoria de infraestrutura urbana", summary: "O Ministério das Cidades anunciou novo programa de investimentos em infraestrutura urbana, com foco em iluminação pública, calçadas e redutores de velocidade em áreas de risco.", source: "Ministério das Cidades", category: "Urbanismo", publishedAt: new Date("2026-02-15") },
    { title: "STF reafirma direito à participação popular em decisões legislativas", summary: "O Supremo Tribunal Federal reafirmou em acórdão que o direito à participação popular em processos legislativos é garantia constitucional que não pode ser suprimida.", source: "STF", category: "Judiciário", publishedAt: new Date("2026-02-10") },
    { title: "Iniciativa popular de lei sobre mobilidade urbana coleta 1 milhão de assinaturas", summary: "Um projeto de lei de iniciativa popular que propõe melhorias na mobilidade urbana das grandes cidades brasileiras atingiu a marca de 1 milhão de assinaturas.", source: "G1", category: "Participação Cidadã", publishedAt: new Date("2026-02-05") },
  ]);
}

// ─── Seed Demo Data (force re-seed with rich examples) ─────────────────────────────────────────────

export async function seedDemoData() {
  const db = await getDb();
  if (!db) return;

  // Clear existing lobbies, communities, posts and channels
  await db.delete(forumPosts);
  await db.delete(communityChannels);
  await db.delete(communities);
  await db.delete(lobbies);

  // Get seed user
  const seedUsers = await db.select().from(users).where(eq(users.openId, "seed_system_user")).limit(1);
  const seedUserId = seedUsers[0]?.id ?? 1;

  // Get constitution articles
  const articles = await db.select().from(constitutionArticles);
  const art6 = articles.find(a => a.articleNumber === "Art. 6º") ?? articles[0];
  const art37 = articles.find(a => a.articleNumber === "Art. 37") ?? articles[0];
  const art182 = articles.find(a => a.articleNumber === "Art. 182") ?? articles[0];
  const art196 = articles.find(a => a.articleNumber === "Art. 196") ?? articles[0];
  const art225 = articles.find(a => a.articleNumber === "Art. 225") ?? articles[0];

  // Insert rich lobbies
  await db.insert(lobbies).values([
    {
      userId: seedUserId,
      title: "Merenda Escolar de Qualidade nas Escolas Públicas",
      description: "Dados do FNDE mostram que 30% das escolas públicas brasileiras servem merenda abaixo dos padrões nutricionais mínimos. Uma mãe de Minas Gerais iniciou esta campanha após descobrir que a escola de seu filho servia apenas biscoito e achocolatado como almoço.",
      objective: "Pressionar o MEC e deputados estaduais para aprovar lei que garanta cardápio nutricional mínimo com proteína, vegetais e fruta em todas as refeições escolares da rede pública.",
      category: "national",
      status: "active",
      constitutionArticleId: art6.id,
      petitionCategory: "education",
      goalCount: 50000,
      lobbyStatus: "pressure",
      supportCount: 47823,
      viewCount: 189400,
      isPriorityAgenda: true,
      targetParlamentarians: JSON.stringify(["Dep. Maria Silva (PT-MG)", "Dep. João Santos (PSDB-SP)", "Sen. Ana Costa (PDT-RJ)"]),
    },
    {
      userId: seedUserId,
      title: "Iluminação Pública na Rua Esperança — Bairro Vila Nova",
      description: "A Rua Esperança está sem iluminação pública há 8 meses. O bairro registrou 12 assaltos e 2 atropelamentos no período. A Prefeitura foi notificada 3 vezes sem resposta.",
      objective: "Exigir que a Prefeitura Municipal restaure a iluminação pública na Rua Esperança no prazo máximo de 30 dias.",
      category: "local",
      status: "active",
      constitutionArticleId: art6.id,
      petitionCategory: "infrastructure",
      goalCount: 500,
      lobbyStatus: "mobilization",
      latitude: "-19.9167",
      longitude: "-43.9345",
      locationAddress: "Rua Esperança, 100-500",
      locationCity: "Belo Horizonte",
      locationState: "MG",
      supportCount: 387,
      viewCount: 2140,
    },
    {
      userId: seedUserId,
      title: "Aumento de 15% na Verba Federal para o SUS",
      description: "O SUS opera com déficit de R$ 22 bilhões anuais. 8,5 milhões de brasileiros aguardam cirurgias eletivas. O Art. 196 da Constituição garante saúde como direito de todos.",
      objective: "Pressionar o Congresso para aprovar emenda ao orçamento federal 2026 que aumente em 15% a verba do SUS.",
      category: "national",
      status: "active",
      constitutionArticleId: art196.id,
      petitionCategory: "health",
      goalCount: 100000,
      lobbyStatus: "pressure",
      supportCount: 89340,
      viewCount: 321000,
      isPriorityAgenda: true,
      targetParlamentarians: JSON.stringify(["Dep. Carlos Mendes (MDB-SP)", "Sen. Roberta Lima (PT-BA)", "Dep. Paulo Ferreira (PL-RJ)"]),
    },
    {
      userId: seedUserId,
      title: "Reforma da Lei de Licitações — Fim do Superfaturamento",
      description: "O TCU identificou irregularidades em 68% das obras federais auditadas em 2025, totalizando R$ 4,7 bilhões em prejuízo ao erário. Precisamos de mecanismos mais rigorosos de controle.",
      objective: "Alterar a Lei nº 14.133/2021 para incluir publicação em tempo real de contratos, comissão cidadã de fiscalização e criminalização do superfaturamento acima de 10%.",
      category: "national",
      status: "active",
      constitutionArticleId: art37.id,
      petitionCategory: "transparency",
      goalCount: 200000,
      lobbyStatus: "processing",
      supportCount: 156780,
      viewCount: 892000,
      isPriorityAgenda: true,
      targetParlamentarians: JSON.stringify(["Dep. Fernanda Oliveira (PSOL-SP)", "Sen. Ricardo Barros (PP-PR)", "Dep. Marcelo Costa (PT-PE)"]),
    },
    {
      userId: seedUserId,
      title: "Ciclofaixa Permanente na Av. Brasil — Rio de Janeiro",
      description: "A Av. Brasil registrou 47 mortes em 2025. Ciclistas e pedestres disputam espaço com veículos pesados sem qualquer proteção.",
      objective: "Solicitar à Prefeitura do Rio de Janeiro a implantação de ciclofaixa permanente e calçada ampliada na Av. Brasil, Zona Norte.",
      category: "local",
      status: "active",
      constitutionArticleId: art182.id,
      petitionCategory: "infrastructure",
      goalCount: 10000,
      lobbyStatus: "mobilization",
      latitude: "-22.8905",
      longitude: "-43.2192",
      locationAddress: "Av. Brasil, Zona Norte",
      locationCity: "Rio de Janeiro",
      locationState: "RJ",
      supportCount: 7234,
      viewCount: 45600,
    },
    {
      userId: seedUserId,
      title: "Educação Ambiental Obrigatória nas Escolas Públicas",
      description: "O Brasil perde 400 mil hectares de Mata Atlântica por ano. 73% dos jovens não sabem identificar espécies nativas da sua região.",
      objective: "Incluir educação ambiental prática como disciplina obrigatória no currículo do ensino fundamental e médio das escolas públicas.",
      category: "national",
      status: "active",
      constitutionArticleId: art225.id,
      petitionCategory: "environment",
      goalCount: 30000,
      lobbyStatus: "mobilization",
      supportCount: 12456,
      viewCount: 67800,
    },
  ]);

  // Insert rich communities
  await db.insert(communities).values([
    {
      creatorId: seedUserId,
      name: "Mães pela Merenda",
      description: "Comunidade de mães, pais e educadores que lutam por alimentação escolar de qualidade. Já conquistamos melhorias em 47 municípios.",
      theme: "Educação",
      memberCount: 5234,
    },
    {
      creatorId: seedUserId,
      name: "SUS Forte — Saúde para Todos",
      description: "Defendemos o fortalecimento do SUS e o direito constitucional à saúde de qualidade. Monitoramos votações e pressionamos parlamentares.",
      theme: "Saúde",
      memberCount: 8547,
    },
    {
      creatorId: seedUserId,
      name: "Transparência Brasil",
      description: "Monitoramos contratos públicos, denunciamos irregularidades e pressionamos por maior transparência nas licitações. Mais de 200 denúncias registradas.",
      theme: "Administração Pública",
      memberCount: 3891,
    },
    {
      creatorId: seedUserId,
      name: "Mobilidade Urbana RJ",
      description: "Lutamos por ciclovias, calçadas acessíveis e segurança viária no Rio de Janeiro.",
      theme: "Urbanismo",
      memberCount: 2156,
    },
  ]);

  // Seed channels and posts for each community
  const allComms = await db.select().from(communities).orderBy(communities.id);
  for (const comm of allComms) {
    await db.insert(communityChannels).values([
      { communityId: comm.id, name: "geral", slug: "geral", description: "Canal geral de discussão", isDefault: true, messageCount: 47 },
      { communityId: comm.id, name: "estratégia", slug: "estrategia", description: "Planejamento e estratégia de pressão", messageCount: 23 },
      { communityId: comm.id, name: "documentos", slug: "documentos", description: "Documentos, pesquisas e evidências", messageCount: 12 },
    ]);
    await db.insert(forumPosts).values([
      {
        communityId: comm.id,
        userId: seedUserId,
        title: "📌 Bem-vindo(a) à comunidade! Leia antes de postar",
        content: "Olá a todos! Este é o espaço para organizar nossa ação coletiva. Regras: 1) Seja respeitoso(a); 2) Compartilhe fontes confiáveis; 3) Use @menções para chamar atenção de membros específicos; 4) Reporte conteúdo inadequado. Juntos somos mais fortes! ✊",
        isPinned: true,
        commentCount: 8,
      },
      {
        communityId: comm.id,
        userId: seedUserId,
        title: "📊 Atualização: Progresso da nossa campanha esta semana",
        content: "Boas notícias! Atingimos 75% da nossa meta de apoios. Três parlamentares já responderam nossas mensagens. O deputado Carlos Mendes pediu reunião para a próxima semana. Continuem pressionando! 💪",
        isPinned: false,
        commentCount: 15,
      },
      {
        communityId: comm.id,
        userId: seedUserId,
        title: "📚 Pesquisa: Dados que fortalecem nossa causa",
        content: "Compilei os principais dados para usar nas mensagens:\n\n• Fonte: IBGE 2025\n• Número afetados: 2,3 milhões de pessoas\n• Custo econômico: R$ 4,7 bilhões/ano\n• Países com solução: Alemanha, Portugal, Chile\n\nUsem esses dados nas mensagens! São irrefutáveis.",
        isPinned: false,
        commentCount: 6,
      },
    ]);
  }
}

// ─── User Profile ───────────────────────────────────────────────────────────────

export async function updateUserName(userId: number, data: { name?: string }) {
  const db = await getDb();
  if (!db) return;
  if (data.name) {
    await db.update(users).set({ name: data.name }).where(eq(users.id, userId));
  }
}

// ─── User Interactions ──────────────────────────────────────────────────────────

export async function trackInteraction(data: InsertUserInteraction) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(userInteractions).values(data);
    // Recalculate preferences after tracking
    await recalculateUserPreferences(data.userId);
  } catch (error) {
    console.warn("[DB] Failed to track interaction:", error);
  }
}

export async function recalculateUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return;
  try {
    // Get last 100 interactions for this user
    const interactions = await db.select()
      .from(userInteractions)
      .where(eq(userInteractions.userId, userId))
      .orderBy(desc(userInteractions.createdAt))
      .limit(100);

    if (interactions.length === 0) return;

    // Count categories (weight: support=3, comment=2, view=1)
    const categoryWeights: Record<string, number> = {};
    const stateWeights: Record<string, number> = {};
    let nationalCount = 0;
    let localCount = 0;

    for (const interaction of interactions) {
      const weight = interaction.action === "support" ? 3 : interaction.action === "comment" ? 2 : 1;
      if (interaction.petitionCategory) {
        categoryWeights[interaction.petitionCategory] = (categoryWeights[interaction.petitionCategory] ?? 0) + weight;
      }
      if (interaction.locationState) {
        stateWeights[interaction.locationState] = (stateWeights[interaction.locationState] ?? 0) + weight;
        localCount += weight;
      } else {
        nationalCount += weight;
      }
    }

    const topCategories = Object.entries(categoryWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);

    const topStates = Object.entries(stateWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([state]) => state);

    const preferredLobbyType = nationalCount > localCount * 2 ? "national" : localCount > nationalCount * 2 ? "local" : "both";

    await db.insert(userPreferences).values({
      userId,
      topCategories: JSON.stringify(topCategories),
      topStates: JSON.stringify(topStates),
      preferredLobbyType: preferredLobbyType as "national" | "local" | "both",
    }).onDuplicateKeyUpdate({
      set: {
        topCategories: JSON.stringify(topCategories),
        topStates: JSON.stringify(topStates),
        preferredLobbyType: preferredLobbyType as "national" | "local" | "both",
      }
    });
  } catch (error) {
    console.warn("[DB] Failed to recalculate preferences:", error);
  }
}

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return result[0] ?? null;
}

// ─── Recommendations ────────────────────────────────────────────────────────────

export async function getRecommendedLobbies(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const prefs = await getUserPreferences(userId);

  // Get lobbies the user already supported
  const supported = await db.select({ lobbyId: lobbySupports.lobbyId })
    .from(lobbySupports)
    .where(eq(lobbySupports.userId, userId));
  const supportedIds = new Set(supported.map(s => s.lobbyId));

  const conditions = [eq(lobbies.status, "active")];

  if (prefs) {
    const topCategories: string[] = JSON.parse(prefs.topCategories ?? "[]");
    const topStates: string[] = JSON.parse(prefs.topStates ?? "[]");

    // Build OR conditions for preferred categories
    const categoryConditions = topCategories.slice(0, 3).map(cat =>
      eq(lobbies.petitionCategory, cat as "infrastructure" | "education" | "health" | "security" | "environment" | "human_rights" | "economy" | "transparency" | "culture")
    );

    // Build OR conditions for preferred states
    const stateConditions = topStates.slice(0, 2).map(state =>
      eq(lobbies.locationState, state)
    );

    const preferenceConditions = [...categoryConditions, ...stateConditions];
    if (preferenceConditions.length > 0) {
      conditions.push(or(...preferenceConditions)!);
    }

    if (prefs.preferredLobbyType !== "both") {
      conditions.push(eq(lobbies.category, prefs.preferredLobbyType as "national" | "local"));
    }
  }

  const results = await db.select().from(lobbies)
    .where(and(...conditions))
    .orderBy(desc(lobbies.supportCount), desc(lobbies.createdAt))
    .limit(limit + supportedIds.size);

  // Filter out already supported lobbies and limit
  return results.filter(l => !supportedIds.has(l.id)).slice(0, limit);
}

export async function getRecommendedCommunities(userId: number, limit = 6) {
  const db = await getDb();
  if (!db) return [];

  const prefs = await getUserPreferences(userId);

  // Get communities the user already joined
  const joined = await db.select({ communityId: communityMembers.communityId })
    .from(communityMembers)
    .where(eq(communityMembers.userId, userId));
  const joinedIds = new Set(joined.map(m => m.communityId));

  const topCategories: string[] = prefs ? JSON.parse(prefs.topCategories ?? "[]") : [];

  // Map petition categories to community themes
  const themeKeywords: Record<string, string[]> = {
    health: ["saúde", "sus", "hospital"],
    education: ["educação", "escola", "ensino"],
    infrastructure: ["infraestrutura", "urbana", "mobilidade", "trânsito"],
    transparency: ["transparência", "corrupção", "licitação"],
    environment: ["meio ambiente", "ambiental", "verde"],
    security: ["segurança", "policia", "crime"],
    economy: ["economia", "tributo", "imposto"],
    human_rights: ["direitos", "humanos", "social"],
    culture: ["cultura", "esporte", "arte"],
  };

  const conditions = [];
  for (const cat of topCategories.slice(0, 3)) {
    const keywords = themeKeywords[cat] ?? [];
    for (const kw of keywords) {
      conditions.push(like(communities.theme, `%${kw}%`));
      conditions.push(like(communities.name, `%${kw}%`));
    }
  }

  const query = conditions.length > 0
    ? db.select().from(communities).where(or(...conditions)).orderBy(desc(communities.memberCount)).limit(limit + joinedIds.size)
    : db.select().from(communities).orderBy(desc(communities.memberCount)).limit(limit + joinedIds.size);

  const results = await query;
  return results.filter(c => !joinedIds.has(c.id)).slice(0, limit);
}

export async function getSimilarUsers(userId: number, limit = 5) {
  const db = await getDb();
  if (!db) return [];

  const prefs = await getUserPreferences(userId);
  if (!prefs) return [];

  const topCategories: string[] = JSON.parse(prefs.topCategories ?? "[]");
  if (topCategories.length === 0) return [];

  // Find users who interacted with same categories
  const similarUserIds = await db.select({ userId: userInteractions.userId })
    .from(userInteractions)
    .where(and(
      eq(userInteractions.petitionCategory, topCategories[0] as "infrastructure" | "education" | "health" | "security" | "environment" | "human_rights" | "economy" | "transparency" | "culture"),
      sql`${userInteractions.userId} != ${userId}`
    ))
    .groupBy(userInteractions.userId)
    .limit(limit * 2);

  if (similarUserIds.length === 0) return [];

  const ids = [...new Set(similarUserIds.map(u => u.userId))].slice(0, limit);
  return db.select({ id: users.id, name: users.name }).from(users)
    .where(sql`${users.id} IN (${ids.join(",")})`);
}

// ─── User Profile Functions ───────────────────────────────────────────────────

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  const [user] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users).where(eq(users.id, userId)).limit(1);

  if (!user) return null;

  return {
    ...user,
    bio: profile?.bio ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
    city: profile?.city ?? null,
    state: profile?.state ?? null,
    interests: profile?.interests ? JSON.parse(profile.interests) as string[] : [],
    followersCount: profile?.followersCount ?? 0,
    followingCount: profile?.followingCount ?? 0,
    lobbiesCreated: profile?.lobbiesCreated ?? 0,
    lobbiesSupported: profile?.lobbiesSupported ?? 0,
    communitiesJoined: profile?.communitiesJoined ?? 0,
  };
}

export async function upsertUserProfile(userId: number, data: {
  bio?: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  interests?: string[];
}) {
  const db = await getDb();
  if (!db) return;

  const [existing] = await db.select({ id: userProfiles.id }).from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);

  const payload = {
    bio: data.bio,
    avatarUrl: data.avatarUrl,
    city: data.city,
    state: data.state,
    interests: data.interests ? JSON.stringify(data.interests) : undefined,
  };

  if (existing) {
    await db.update(userProfiles).set(payload).where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({ userId, ...payload });
  }
}

export async function followUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) return;

  // Check if already following
  const [existing] = await db.select({ id: userFollows.id })
    .from(userFollows)
    .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)))
    .limit(1);

  if (existing) return { alreadyFollowing: true };

  await db.insert(userFollows).values({ followerId, followingId });

  // Update counters
  await db.update(userProfiles)
    .set({ followingCount: sql`followingCount + 1` })
    .where(eq(userProfiles.userId, followerId));
  await db.update(userProfiles)
    .set({ followersCount: sql`followersCount + 1` })
    .where(eq(userProfiles.userId, followingId));

  // Record activity
  await recordActivity(followerId, "follow", followingId, undefined);

  return { alreadyFollowing: false };
}

export async function unfollowUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(userFollows)
    .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)));

  // Update counters
  await db.update(userProfiles)
    .set({ followingCount: sql`GREATEST(followingCount - 1, 0)` })
    .where(eq(userProfiles.userId, followerId));
  await db.update(userProfiles)
    .set({ followersCount: sql`GREATEST(followersCount - 1, 0)` })
    .where(eq(userProfiles.userId, followingId));
}

export async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [row] = await db.select({ id: userFollows.id })
    .from(userFollows)
    .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)))
    .limit(1);
  return !!row;
}

export async function getFollowers(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select({
    id: users.id,
    name: users.name,
    followedAt: userFollows.createdAt,
  })
    .from(userFollows)
    .innerJoin(users, eq(users.id, userFollows.followerId))
    .where(eq(userFollows.followingId, userId))
    .orderBy(desc(userFollows.createdAt))
    .limit(limit);

  return rows;
}

export async function getFollowing(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select({
    id: users.id,
    name: users.name,
    followedAt: userFollows.createdAt,
  })
    .from(userFollows)
    .innerJoin(users, eq(users.id, userFollows.followingId))
    .where(eq(userFollows.followerId, userId))
    .orderBy(desc(userFollows.createdAt))
    .limit(limit);

  return rows;
}

export async function searchUsers(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(sql`${users.name} LIKE ${`%${query}%`}`)
    .limit(limit);
}

// ─── Activity Feed Functions ──────────────────────────────────────────────────

export async function recordActivity(
  userId: number,
  type: "lobby_created" | "lobby_supported" | "community_joined" | "community_created" | "post_created" | "comment_created" | "follow",
  targetId?: number,
  targetTitle?: string,
  targetCategory?: string,
  metadata?: Record<string, unknown>
) {
  const db = await getDb();
  if (!db) return;

  await db.insert(activityFeed).values({
    userId,
    type,
    targetId: targetId ?? null,
    targetTitle: targetTitle ?? null,
    targetCategory: targetCategory ?? null,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

export async function getUserActivityFeed(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(activityFeed)
    .where(eq(activityFeed.userId, userId))
    .orderBy(desc(activityFeed.createdAt))
    .limit(limit);
}

export async function getPersonalizedFeed(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];

  // Get IDs of users this person follows
  const following = await db.select({ followingId: userFollows.followingId })
    .from(userFollows)
    .where(eq(userFollows.followerId, userId));

  if (following.length === 0) return [];

  const followingIds = following.map(f => f.followingId);

  // Get their recent activities with user info
  const activities = await db.select({
    id: activityFeed.id,
    type: activityFeed.type,
    targetId: activityFeed.targetId,
    targetTitle: activityFeed.targetTitle,
    targetCategory: activityFeed.targetCategory,
    metadata: activityFeed.metadata,
    createdAt: activityFeed.createdAt,
    actorId: users.id,
    actorName: users.name,
  })
    .from(activityFeed)
    .innerJoin(users, eq(users.id, activityFeed.userId))
    .where(sql`${activityFeed.userId} IN (${followingIds.join(",")})`)
    .orderBy(desc(activityFeed.createdAt))
    .limit(limit);

  return activities;
}

export async function getUserLobbies(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lobbies)
    .where(eq(lobbies.userId, userId))
    .orderBy(desc(lobbies.createdAt))
    .limit(limit);
}

export async function getUserSupportedLobbies(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    id: lobbies.id,
    title: lobbies.title,
    category: lobbies.category,
    status: lobbies.status,
    supportCount: lobbies.supportCount,
    locationCity: lobbies.locationCity,
    locationState: lobbies.locationState,
    supportedAt: lobbySupports.createdAt,
  })
    .from(lobbySupports)
    .innerJoin(lobbies, eq(lobbies.id, lobbySupports.lobbyId))
    .where(eq(lobbySupports.userId, userId))
    .orderBy(desc(lobbySupports.createdAt))
    .limit(limit);
}

export async function getUserCommunities(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    id: communities.id,
    name: communities.name,
    theme: communities.theme,
    memberCount: communities.memberCount,
    joinedAt: communityMembers.joinedAt,
  })
    .from(communityMembers)
    .innerJoin(communities, eq(communities.id, communityMembers.communityId))
    .where(eq(communityMembers.userId, userId))
    .orderBy(desc(communityMembers.joinedAt))
    .limit(limit);
}

export async function incrementProfileStat(userId: number, stat: "lobbiesCreated" | "lobbiesSupported" | "communitiesJoined", delta = 1) {
  const db = await getDb();
  if (!db) return;

  const [existing] = await db.select({ id: userProfiles.id }).from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  if (!existing) {
    await db.insert(userProfiles).values({ userId });
  }

  if (stat === "lobbiesCreated") {
    await db.update(userProfiles).set({ lobbiesCreated: sql`lobbiesCreated + ${delta}` }).where(eq(userProfiles.userId, userId));
  } else if (stat === "lobbiesSupported") {
    await db.update(userProfiles).set({ lobbiesSupported: sql`lobbiesSupported + ${delta}` }).where(eq(userProfiles.userId, userId));
  } else if (stat === "communitiesJoined") {
    await db.update(userProfiles).set({ communitiesJoined: sql`communitiesJoined + ${delta}` }).where(eq(userProfiles.userId, userId));
  }
}

// ─── Community Channels ────────────────────────────────────────────────────────

export async function getChannelsByCommunity(communityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityChannels)
    .where(eq(communityChannels.communityId, communityId))
    .orderBy(communityChannels.createdAt);
}

export async function createChannel(data: {
  communityId: number;
  name: string;
  slug: string;
  description?: string;
  isDefault?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(communityChannels).values({
    communityId: data.communityId,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    isDefault: data.isDefault ?? false,
  });
}

export async function createDefaultChannels(communityId: number) {
  const defaults = [
    { name: "Debates", slug: "debates", description: "Discussões gerais sobre o tema da comunidade", isDefault: true },
    { name: "Mobilização", slug: "mobilizacao", description: "Organize ações e mobilize membros" },
    { name: "Documentos", slug: "documentos", description: "Compartilhe documentos, leis e referências" },
    { name: "Votações", slug: "votacoes", description: "Enquetes e votações da comunidade" },
  ];
  for (const ch of defaults) {
    await createChannel({ communityId, ...ch });
  }
}

export async function getChannelMessages(channelId: number, limit = 50, before?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = before
    ? and(eq(channelMessages.channelId, channelId), sql`${channelMessages.id} < ${before}`)
    : eq(channelMessages.channelId, channelId);
  const msgs = await db
    .select({
      id: channelMessages.id,
      channelId: channelMessages.channelId,
      userId: channelMessages.userId,
      content: channelMessages.content,
      mentions: channelMessages.mentions,
      replyToId: channelMessages.replyToId,
      isEdited: channelMessages.isEdited,
      createdAt: channelMessages.createdAt,
      userName: users.name,
    })
    .from(channelMessages)
    .leftJoin(users, eq(users.id, channelMessages.userId))
    .where(conditions)
    .orderBy(desc(channelMessages.createdAt))
    .limit(limit);
  return msgs.reverse();
}

// ─── Direct Messages ───────────────────────────────────────────────────────────

export async function getDMConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const sent = await db
    .select({ partnerId: directMessages.receiverId, lastMessage: directMessages.content, lastAt: directMessages.createdAt })
    .from(directMessages)
    .where(eq(directMessages.senderId, userId))
    .orderBy(desc(directMessages.createdAt));
  const received = await db
    .select({ partnerId: directMessages.senderId, lastMessage: directMessages.content, lastAt: directMessages.createdAt })
    .from(directMessages)
    .where(eq(directMessages.receiverId, userId))
    .orderBy(desc(directMessages.createdAt));

  const partnerMap = new Map<number, { partnerId: number; lastMessage: string; lastAt: Date }>();
  for (const m of [...sent, ...received]) {
    const existing = partnerMap.get(m.partnerId);
    if (!existing || m.lastAt > existing.lastAt) {
      partnerMap.set(m.partnerId, { partnerId: m.partnerId, lastMessage: m.lastMessage, lastAt: m.lastAt });
    }
  }
  const partners = Array.from(partnerMap.values()).sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
  const result = [];
  for (const p of partners) {
    const [user] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, p.partnerId)).limit(1);
    if (user) result.push({ ...p, partnerName: user.name });
  }
  return result;
}

export async function getDMMessages(userId: number, partnerId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: directMessages.id,
      senderId: directMessages.senderId,
      receiverId: directMessages.receiverId,
      content: directMessages.content,
      readAt: directMessages.readAt,
      createdAt: directMessages.createdAt,
    })
    .from(directMessages)
    .where(
      or(
        and(eq(directMessages.senderId, userId), eq(directMessages.receiverId, partnerId)),
        and(eq(directMessages.senderId, partnerId), eq(directMessages.receiverId, userId)),
      ),
    )
    .orderBy(desc(directMessages.createdAt))
    .limit(limit);
}

// ─── Lobby Milestones ──────────────────────────────────────────────────────────

export async function getLobbyMilestones(lobbyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lobbyMilestones)
    .where(eq(lobbyMilestones.lobbyId, lobbyId))
    .orderBy(lobbyMilestones.targetCount);
}

export async function createDefaultMilestones(lobbyId: number, goalCount: number) {
  const db = await getDb();
  if (!db) return;
  const milestones = [
    { targetCount: Math.round(goalCount * 0.1), title: "Primeiros Apoiadores", description: "10% da meta atingida!", reward: "Publicação nas redes sociais" },
    { targetCount: Math.round(goalCount * 0.25), title: "Movimento Crescendo", description: "25% da meta atingida!", reward: "Contato com assessoria parlamentar" },
    { targetCount: Math.round(goalCount * 0.5), title: "Metade do Caminho", description: "50% da meta atingida!", reward: "Audiência pública solicitada" },
    { targetCount: goalCount, title: "Meta Atingida!", description: "100% da meta alcançada!", reward: "Reunião com parlamentar responsável" },
  ];
  for (const m of milestones) {
    await db.insert(lobbyMilestones).values({ lobbyId, ...m });
  }
}

export async function checkAndUpdateMilestones(lobbyId: number, currentCount: number) {
  const db = await getDb();
  if (!db) return;
  const milestones = await getLobbyMilestones(lobbyId);
  for (const m of milestones) {
    if (!m.reachedAt && currentCount >= m.targetCount) {
      await db.update(lobbyMilestones).set({ reachedAt: new Date() }).where(eq(lobbyMilestones.id, m.id));
      await addTimelineEvent({
        lobbyId,
        type: "milestone",
        title: `🏆 Marco atingido: ${m.title}`,
        description: m.description ?? undefined,
      });
    }
  }
}

// ─── Lobby Timeline ────────────────────────────────────────────────────────────

export async function getLobbyTimeline(lobbyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lobbyTimeline)
    .where(eq(lobbyTimeline.lobbyId, lobbyId))
    .orderBy(desc(lobbyTimeline.createdAt));
}

export async function addTimelineEvent(data: {
  lobbyId: number;
  type: "created" | "milestone" | "update" | "media" | "response" | "concluded";
  title: string;
  description?: string;
  mediaUrl?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(lobbyTimeline).values({
    lobbyId: data.lobbyId,
    type: data.type,
    title: data.title,
    description: data.description ?? null,
    mediaUrl: data.mediaUrl ?? null,
  });
}

// ─── Lobby Supporters by State (Geo Heatmap) ──────────────────────────────────

export async function getLobbySupportsGeo(lobbyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ state: userProfiles.state, count: sql<number>`COUNT(*)` })
    .from(lobbySupports)
    .leftJoin(userProfiles, eq(userProfiles.userId, lobbySupports.userId))
    .where(eq(lobbySupports.lobbyId, lobbyId))
    .groupBy(userProfiles.state);
}

// ─── Update Lobby Status (extended) ───────────────────────────────────────────

export async function updateLobbyStatusExtended(
  lobbyId: number,
  status: "mobilization" | "pressure" | "processing" | "concluded",
) {
  const db = await getDb();
  if (!db) return;
  const STATUS_LABELS: Record<string, string> = {
    mobilization: "Mobilização",
    pressure: "Pressão",
    processing: "Tramitação",
    concluded: "Concluído",
  };
  await db.update(lobbies).set({ lobbyStatus: status }).where(eq(lobbies.id, lobbyId));
  await addTimelineEvent({
    lobbyId,
    type: status === "concluded" ? "concluded" : "update",
    title: `Status atualizado: ${STATUS_LABELS[status]}`,
    description: `O lobby avançou para a fase de ${STATUS_LABELS[status]}.`,
  });
}

// ─── Pressure Actions ─────────────────────────────────────────────────────────
export async function trackPressureAction(data: {
  userId: number;
  lobbyId: number;
  channel: "whatsapp" | "email" | "twitter" | "instagram" | "phone" | "copy";
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(pressureActions).values(data);
  await db.insert(userInteractions).values({
    userId: data.userId,
    lobbyId: data.lobbyId,
    action: "share",
  });
}

export async function getPressureStats(lobbyId: number) {
  const db = await getDb();
  if (!db) return { total: 0, weekly: 0, byChannel: {} as Record<string, number> };
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [allActions, weeklyActions] = await Promise.all([
    db.select().from(pressureActions).where(eq(pressureActions.lobbyId, lobbyId)),
    db.select().from(pressureActions).where(
      and(eq(pressureActions.lobbyId, lobbyId), gte(pressureActions.createdAt, oneWeekAgo))
    ),
  ]);
  const byChannel: Record<string, number> = {};
  for (const a of allActions) {
    byChannel[a.channel] = (byChannel[a.channel] || 0) + 1;
  }
  return { total: allActions.length, weekly: weeklyActions.length, byChannel };
}

// ─── Smart Milestones ─────────────────────────────────────────────────────────
export const SMART_MILESTONES_CONFIG = [
  { targetCount: 500, action: "Envio de ofício ao gabinete do vereador", description: "Com 500 apoios, o sistema envia automaticamente um ofício formal ao gabinete do vereador responsável pela área." },
  { targetCount: 1000, action: "Solicitação de audiência pública", description: "Com 1.000 apoios, é protocolada uma solicitação formal de audiência pública na câmara municipal ou assembleia legislativa." },
  { targetCount: 5000, action: "Indicação formal por vereador aliado", description: "Com 5.000 apoios, um vereador aliado apresenta uma indicação formal sobre o tema na câmara municipal." },
  { targetCount: 10000, action: "Projeto de lei municipal apresentado", description: "Com 10.000 apoios, um projeto de lei é formalmente apresentado na câmara municipal ou assembleia legislativa." },
  { targetCount: 50000, action: "Mobilização nacional e cobertura da imprensa", description: "Com 50.000 apoios, a campanha atinge escala nacional e é encaminhada para cobertura da grande imprensa e parlamentares federais." },
] as const;

export async function getSmartMilestones(lobbyId: number) {
  const db = await getDb();
  if (!db) return [];
  const existing = await db.select().from(smartMilestones).where(eq(smartMilestones.lobbyId, lobbyId));
  if (existing.length > 0) return existing;
  const toInsert = SMART_MILESTONES_CONFIG.map(m => ({
    lobbyId,
    targetCount: m.targetCount,
    action: m.action,
    description: m.description,
    achieved: false,
  }));
  await db.insert(smartMilestones).values(toInsert);
  return db.select().from(smartMilestones).where(eq(smartMilestones.lobbyId, lobbyId));
}

export async function checkAndAchieveSmartMilestones(lobbyId: number, currentCount: number) {
  const db = await getDb();
  if (!db) return;
  const milestones = await db.select().from(smartMilestones).where(
    and(eq(smartMilestones.lobbyId, lobbyId), eq(smartMilestones.achieved, false))
  );
  for (const m of milestones) {
    if (currentCount >= m.targetCount) {
      await db.update(smartMilestones)
        .set({ achieved: true, achievedAt: new Date() })
        .where(eq(smartMilestones.id, m.id));
      await addTimelineEvent({
        lobbyId,
        type: "milestone",
        title: `Meta atingida: ${m.targetCount.toLocaleString()} apoios!`,
        description: m.action,
      });
    }
  }
}

export async function generatePressureCards(lobby: {
  id: number;
  title: string;
  description: string;
  supportCount: number;
  goalCount: number;
  locationCity?: string | null;
  locationState?: string | null;
}) {
  return [
    {
      type: "problem",
      title: "O Problema",
      headline: lobby.title,
      body: lobby.description.slice(0, 150) + (lobby.description.length > 150 ? "..." : ""),
      stat: `${lobby.supportCount.toLocaleString()} pessoas já apoiam`,
      cta: "Pressionar Agora",
      color: "#1B4F72",
    },
    {
      type: "target",
      title: "A Meta",
      headline: `Faltam ${Math.max(0, lobby.goalCount - lobby.supportCount).toLocaleString()} apoios`,
      body: `Ajude a atingir ${lobby.goalCount.toLocaleString()} apoios para levar esta causa aos representantes eleitos.`,
      stat: `${Math.round((lobby.supportCount / lobby.goalCount) * 100)}% da meta atingida`,
      cta: "Apoiar Agora",
      color: "#1E8449",
    },
    {
      type: "location",
      title: "O Impacto",
      headline: lobby.locationCity ? `${lobby.locationCity}, ${lobby.locationState}` : "Todo o Brasil",
      body: `Esta campanha afeta diretamente moradores de ${lobby.locationCity || "todo o Brasil"}. Compartilhe e amplie o alcance.`,
      stat: `${lobby.supportCount.toLocaleString()} apoiadores`,
      cta: "Compartilhar",
      color: "#7D3C98",
    },
    {
      type: "action",
      title: "Aja Agora",
      headline: "Sua voz importa",
      body: "Cada mensagem enviada a um parlamentar aumenta a pressão política. Juntos somos mais fortes.",
      stat: "Democracia participativa em ação",
      cta: "Pressionar Agora",
      color: "#C0392B",
    },
  ];
}

// ─── Lobby Plebiscites ────────────────────────────────────────────────────────

export async function createLobbyPlebiscite(data: InsertLobbyPlebiscite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(lobbyPlebiscites).values(data);
  return result[0].insertId;
}

export async function getLobbyPlebisciteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lobbyPlebiscites).where(eq(lobbyPlebiscites.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActivePlebisciteByLobby(lobbyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lobbyPlebiscites)
    .where(and(eq(lobbyPlebiscites.lobbyId, lobbyId), eq(lobbyPlebiscites.status, "active")))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPlebisciteByLobby(lobbyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lobbyPlebiscites)
    .where(eq(lobbyPlebiscites.lobbyId, lobbyId))
    .orderBy(desc(lobbyPlebiscites.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function hasUserVotedPlebiscite(plebisciteId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(plebisciteVotes)
    .where(and(eq(plebisciteVotes.plebisciteId, plebisciteId), eq(plebisciteVotes.userId, userId)))
    .limit(1);
  return result.length > 0;
}

export async function castPlebisciteVote(plebisciteId: number, userId: number, vote: "yes" | "no") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(plebisciteVotes).values({ plebisciteId, userId, vote });
  if (vote === "yes") {
    await db.update(lobbyPlebiscites)
      .set({ yesVotes: sql`${lobbyPlebiscites.yesVotes} + 1` })
      .where(eq(lobbyPlebiscites.id, plebisciteId));
  } else {
    await db.update(lobbyPlebiscites)
      .set({ noVotes: sql`${lobbyPlebiscites.noVotes} + 1` })
      .where(eq(lobbyPlebiscites.id, plebisciteId));
  }
  // Check if approved (>66% yes with at least 100 votes)
  const plebiscite = await getLobbyPlebisciteById(plebisciteId);
  if (plebiscite) {
    const total = plebiscite.yesVotes + plebiscite.noVotes;
    const yesPercent = total > 0 ? plebiscite.yesVotes / total : 0;
    if (total >= 100 && yesPercent >= 0.66) {
      await db.update(lobbyPlebiscites)
        .set({ status: "approved" })
        .where(eq(lobbyPlebiscites.id, plebisciteId));
      // Mark lobby as priority agenda for 7 days
      const priorityUntil = new Date();
      priorityUntil.setDate(priorityUntil.getDate() + 7);
      await db.update(lobbies)
        .set({ isPriorityAgenda: true, priorityAgendaUntil: priorityUntil } as any)
        .where(eq(lobbies.id, plebiscite.lobbyId));
    }
  }
}

// ─── National Plebiscites ─────────────────────────────────────────────────────

export async function createNationalPlebiscite(data: InsertNationalPlebiscite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(nationalPlebiscites).values(data);
  return result[0].insertId;
}

export async function getNationalPlebiscites(status?: "active" | "closed" | "sent_to_chamber") {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(nationalPlebiscites)
      .where(eq(nationalPlebiscites.status, status))
      .orderBy(desc(nationalPlebiscites.createdAt));
  }
  return db.select().from(nationalPlebiscites).orderBy(desc(nationalPlebiscites.createdAt));
}

export async function getNationalPlebisciteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(nationalPlebiscites).where(eq(nationalPlebiscites.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function hasUserVotedNationalPlebiscite(plebisciteId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(nationalPlebisciteVotes)
    .where(and(eq(nationalPlebisciteVotes.plebisciteId, plebisciteId), eq(nationalPlebisciteVotes.userId, userId)))
    .limit(1);
  return result.length > 0;
}

export async function castNationalPlebisciteVote(plebisciteId: number, userId: number, vote: "yes" | "no", state?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(nationalPlebisciteVotes).values({ plebisciteId, userId, vote, state });
  if (vote === "yes") {
    await db.update(nationalPlebiscites)
      .set({ yesVotes: sql`${nationalPlebiscites.yesVotes} + 1` })
      .where(eq(nationalPlebiscites.id, plebisciteId));
  } else {
    await db.update(nationalPlebiscites)
      .set({ noVotes: sql`${nationalPlebiscites.noVotes} + 1` })
      .where(eq(nationalPlebiscites.id, plebisciteId));
  }
}

export async function markNationalPlebisciteSentToChamber(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(nationalPlebiscites)
    .set({ status: "sent_to_chamber", sentToChamberAt: new Date() })
    .where(eq(nationalPlebiscites.id, id));
}

export async function getNationalPlebisciteVotesByState(plebisciteId: number) {
  const db = await getDb();
  if (!db) return [];
  const votes = await db.select().from(nationalPlebisciteVotes)
    .where(eq(nationalPlebisciteVotes.plebisciteId, plebisciteId));
  const byState: Record<string, { yes: number; no: number }> = {};
  for (const v of votes) {
    const s = v.state || "??";
    if (!byState[s]) byState[s] = { yes: 0, no: 0 };
    if (v.vote === "yes") byState[s].yes++;
    else byState[s].no++;
  }
  return Object.entries(byState).map(([state, counts]) => ({ state, ...counts }));
}

// ─── Power Metrics ────────────────────────────────────────────────────────────

export async function getPowerMetrics() {
  const db = await getDb();
  if (!db) return { totalCitizens: 0, electoratePercent: "0.00", billsInfluenced: 0, victories: 0 };
  const result = await db.select().from(powerMetrics).limit(1);
  if (result.length > 0) return result[0];
  // Auto-create initial metrics
  await db.insert(powerMetrics).values({
    totalCitizens: 1000000,
    electoratePercent: "2.00",
    billsInfluenced: 15,
    victories: 7,
  });
  const created = await db.select().from(powerMetrics).limit(1);
  return created[0];
}

// ─── Gamification — Points & Achievements ─────────────────────────────────────

const POINTS_MAP: Record<string, number> = {
  lobby_support: 10,
  lobby_create: 50,
  pressure_action: 20,
  share_card: 5,
  invite_friend: 100,
  lobby_approved: 500,
};

export const CITIZEN_LEVELS = [
  { level: 1, title: "Observador",        minPoints: 0,     maxPoints: 100,   color: "#9BA1A6", emoji: "👁️" },
  { level: 2, title: "Apoiador",          minPoints: 101,   maxPoints: 500,   color: "#27AE60", emoji: "🤝" },
  { level: 3, title: "Mobilizador",       minPoints: 501,   maxPoints: 2000,  color: "#2980B9", emoji: "📣" },
  { level: 4, title: "Líder Comunitário", minPoints: 2001,  maxPoints: 10000, color: "#8E44AD", emoji: "🏛️" },
  { level: 5, title: "Herói Popular",     minPoints: 10001, maxPoints: Infinity, color: "#C0392B", emoji: "⭐" },
] as const;

export function getLevelForPoints(points: number) {
  for (let i = CITIZEN_LEVELS.length - 1; i >= 0; i--) {
    if (points >= CITIZEN_LEVELS[i].minPoints) return CITIZEN_LEVELS[i];
  }
  return CITIZEN_LEVELS[0];
}

export async function awardPoints(
  userId: number,
  action: "lobby_support" | "lobby_create" | "pressure_action" | "share_card" | "invite_friend" | "lobby_approved",
  referenceId?: number,
  description?: string,
): Promise<{ newTotal: number; levelUp: boolean; newLevel: typeof CITIZEN_LEVELS[number] | null }> {
  const db = await getDb();
  if (!db) return { newTotal: 0, levelUp: false, newLevel: null };

  const points = POINTS_MAP[action] ?? 0;
  if (points === 0) return { newTotal: 0, levelUp: false, newLevel: null };

  // Insert point record
  await db.insert(userPoints).values({ userId, action, points, referenceId, description });

  // Get current total
  const existing = await db.select({ totalPoints: userPoints.points })
    .from(userPoints)
    .where(eq(userPoints.userId, userId));
  const oldTotal = existing.reduce((sum, r) => sum + (r.totalPoints ?? 0), 0) - points;
  const newTotal = oldTotal + points;

  const oldLevel = getLevelForPoints(oldTotal);
  const newLevel = getLevelForPoints(newTotal);
  const levelUp = newLevel.level > oldLevel.level;

  return { newTotal, levelUp, newLevel: levelUp ? newLevel : null };
}

export async function getUserPointsTotal(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ p: userPoints.points })
    .from(userPoints)
    .where(eq(userPoints.userId, userId));
  return rows.reduce((sum, r) => sum + (r.p ?? 0), 0);
}

export async function getUserPointsHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userPoints)
    .where(eq(userPoints.userId, userId))
    .orderBy(desc(userPoints.createdAt))
    .limit(limit);
}

export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userAchievements)
    .where(eq(userAchievements.userId, userId))
    .orderBy(desc(userAchievements.unlockedAt));
}

export async function checkAndUnlockAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const newAchievements: string[] = [];

  // Get existing achievements
  const existing = await db.select({ key: userAchievements.achievementKey })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  const existingKeys = new Set(existing.map(e => e.key));

  // Check first_support
  if (!existingKeys.has("first_support")) {
    const supports = await db.select().from(userPoints)
      .where(and(eq(userPoints.userId, userId), eq(userPoints.action, "lobby_support")))
      .limit(1);
    if (supports.length > 0) {
      await db.insert(userAchievements).values({ userId, achievementKey: "first_support" });
      newAchievements.push("first_support");
    }
  }

  // Check first_lobby
  if (!existingKeys.has("first_lobby")) {
    const lobbiesCreated = await db.select().from(userPoints)
      .where(and(eq(userPoints.userId, userId), eq(userPoints.action, "lobby_create")))
      .limit(1);
    if (lobbiesCreated.length > 0) {
      await db.insert(userAchievements).values({ userId, achievementKey: "first_lobby" });
      newAchievements.push("first_lobby");
    }
  }

  // Check first_pressure
  if (!existingKeys.has("first_pressure")) {
    const pressures = await db.select().from(userPoints)
      .where(and(eq(userPoints.userId, userId), eq(userPoints.action, "pressure_action")))
      .limit(1);
    if (pressures.length > 0) {
      await db.insert(userAchievements).values({ userId, achievementKey: "first_pressure" });
      newAchievements.push("first_pressure");
    }
  }

  // Check pressure_1000 — 1000 pressure actions total
  if (!existingKeys.has("pressure_1000")) {
    const pressureCount = await db.select().from(pressureActions)
      .where(eq(pressureActions.userId, userId));
    if (pressureCount.length >= 1000) {
      await db.insert(userAchievements).values({ userId, achievementKey: "pressure_1000" });
      newAchievements.push("pressure_1000");
    }
  }

  return newAchievements;
}

export async function getGamificationLeaderboard(limit = 10) {
  const db = await getDb();
  if (!db) return [];

  // Aggregate points per user
  const rows = await db.select({
    userId: userPoints.userId,
    totalPoints: sql<number>`SUM(${userPoints.points})`.as("totalPoints"),
  })
    .from(userPoints)
    .groupBy(userPoints.userId)
    .orderBy(desc(sql`SUM(${userPoints.points})`))
    .limit(limit);

  // Get user names
  const result = await Promise.all(rows.map(async (r) => {
    const userRow = await db.select({ name: users.name }).from(users).where(eq(users.id, r.userId)).limit(1);
    const profile = await db.select({ avatarUrl: userProfiles.avatarUrl, city: userProfiles.city, state: userProfiles.state })
      .from(userProfiles).where(eq(userProfiles.userId, r.userId)).limit(1);
    const level = getLevelForPoints(r.totalPoints ?? 0);
    return {
      userId: r.userId,
      name: userRow[0]?.name ?? "Cidadão",
      totalPoints: r.totalPoints ?? 0,
      level,
      avatarUrl: profile[0]?.avatarUrl,
      city: profile[0]?.city,
      state: profile[0]?.state,
    };
  }));

  return result;
}

// ─── Moderation ───────────────────────────────────────────────────────────────

export async function createModerationQueueItem(data: {
  contentType: "lobby" | "post" | "comment";
  contentId: number;
  contentTitle?: string;
  contentText?: string;
  userId: number;
  aiScore?: number;
  aiFlags?: string[];
  aiReason?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(moderationQueue).values({
    contentType: data.contentType,
    contentId: data.contentId,
    contentTitle: data.contentTitle,
    contentText: data.contentText,
    userId: data.userId,
    status: "pending",
    aiScore: data.aiScore?.toString(),
    aiFlags: data.aiFlags ? JSON.stringify(data.aiFlags) : null,
    aiReason: data.aiReason,
  });
  return result[0].insertId;
}

export async function getModerationQueue(opts?: {
  status?: "pending" | "approved" | "rejected" | "escalated";
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.status) conditions.push(eq(moderationQueue.status, opts.status));
  return db.select().from(moderationQueue)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(moderationQueue.createdAt))
    .limit(opts?.limit ?? 20)
    .offset(opts?.offset ?? 0);
}

export async function reviewModerationItem(opts: {
  queueId: number;
  moderatorId: number;
  action: "approve" | "reject" | "escalate" | "request_edit";
  note?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const statusMap = {
    approve: "approved" as const,
    reject: "rejected" as const,
    escalate: "escalated" as const,
    request_edit: "pending" as const,
  };
  await db.update(moderationQueue).set({
    status: statusMap[opts.action],
    reviewedBy: opts.moderatorId,
    reviewedAt: new Date(),
    reviewNote: opts.note,
  }).where(eq(moderationQueue.id, opts.queueId));
  await db.insert(moderationLogs).values({
    queueId: opts.queueId,
    moderatorId: opts.moderatorId,
    action: opts.action,
    note: opts.note,
  });
}

export async function getModerationQueueItem(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(moderationQueue).where(eq(moderationQueue.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getModerationStats() {
  const db = await getDb();
  if (!db) return { pending: 0, approved: 0, rejected: 0, escalated: 0 };
  const rows = await db.select({
    status: moderationQueue.status,
    count: sql<number>`COUNT(*)`.as("count"),
  }).from(moderationQueue).groupBy(moderationQueue.status);
  const stats = { pending: 0, approved: 0, rejected: 0, escalated: 0 };
  for (const row of rows) {
    if (row.status in stats) stats[row.status as keyof typeof stats] = row.count;
  }
  return stats;
}

export async function createContentReport(data: {
  reporterId: number;
  contentType: "lobby" | "post" | "comment" | "user";
  contentId: number;
  reason: "hate_speech" | "criminal_content" | "fake_news" | "spam" | "harassment" | "other";
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentReports).values(data);
  return result[0].insertId;
}

// ─── Privacy Settings (LGPD) ─────────────────────────────────────────────────

export async function getPrivacySettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(privacySettings).where(eq(privacySettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertPrivacySettings(userId: number, data: Partial<{
  profileVisibility: "public" | "followers" | "private";
  showLocation: boolean;
  showActivity: boolean;
  showPoints: boolean;
  allowAnonymous: boolean;
  anonymousAlias: string;
  dataConsentAt: Date;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(privacySettings).where(eq(privacySettings.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(privacySettings).set(data).where(eq(privacySettings.userId, userId));
  } else {
    await db.insert(privacySettings).values({ userId, ...data });
  }
}

export async function getDefaultPrivacySettings() {
  return {
    profileVisibility: "public" as const,
    showLocation: true,
    showActivity: true,
    showPoints: true,
    allowAnonymous: false,
    anonymousAlias: null,
    dataConsentAt: null,
  };
}

// ─── Press / Journalists ───────────────────────────────────────────────────────

export async function upsertPressJournalist(data: {
  name: string;
  email: string;
  outlet: string;
  role?: string;
  phone?: string;
  categories?: string;
  regions?: string;
  minSupportThreshold?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(pressJournalists).values({
    name: data.name,
    email: data.email,
    outlet: data.outlet,
    role: data.role,
    phone: data.phone,
    categories: data.categories ?? "[]",
    regions: data.regions ?? "[]",
    minSupportThreshold: data.minSupportThreshold ?? 1000,
    verified: false,
    alertsEnabled: true,
  }).onDuplicateKeyUpdate({
    set: {
      name: data.name,
      outlet: data.outlet,
      role: data.role,
      phone: data.phone,
      categories: data.categories ?? "[]",
      regions: data.regions ?? "[]",
      minSupportThreshold: data.minSupportThreshold ?? 1000,
      alertsEnabled: true,
    },
  });
}

export async function getPressAlertsByLobby(lobbyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pressAlerts).where(eq(pressAlerts.lobbyId, lobbyId)).orderBy(desc(pressAlerts.sentAt)).limit(50);
}

export async function createPressAlert(data: {
  lobbyId: number;
  journalistId: number;
  alertType: "new_lobby" | "milestone_reached" | "priority_agenda" | "bill_submitted";
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(pressAlerts).values(data);
}

// ─── Citizen Feed (Feed Social de Denúncias Cidadãs) ─────────────────────────

export interface CitizenPostWithAuthor {
  id: number;
  userId: number;
  authorName: string;
  authorAvatar?: string;
  content: string;
  mediaUrls: string[];
  mediaTypes: Array<"image" | "video">;
  category: string;
  locationAddress?: string;
  locationCity?: string;
  locationState?: string;
  latitude?: string | null;
  longitude?: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  createdAt: Date;
}
function safeParseJSON<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val) as T; } catch { return fallback; }
}

export async function createCitizenPost(data: {
  userId: number;
  content: string;
  mediaUrls: string[];
  mediaTypes: Array<"image" | "video">;
  category: string;
  locationAddress?: string;
  locationCity?: string;
  locationState?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(citizenPosts).values({
    userId: data.userId,
    content: data.content,
    mediaUrls: JSON.stringify(data.mediaUrls),
    mediaTypes: JSON.stringify(data.mediaTypes),
    category: data.category as any,
    locationAddress: data.locationAddress,
    locationCity: data.locationCity,
    locationState: data.locationState,
  });
  return (result as any)[0]?.insertId ?? 0;
}

export async function getCitizenPostsForMap(): Promise<Array<{
  id: number;
  userId: number;
  authorName: string;
  authorAvatar?: string;
  content: string;
  category: string;
  locationCity?: string;
  locationState?: string;
  latitude: string;
  longitude: string;
  likesCount: number;
  commentsCount: number;
  mediaUrls: string[];
  mediaTypes: Array<"image" | "video">;
  createdAt: Date;
}>> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      post: citizenPosts,
      profile: userProfiles,
    })
    .from(citizenPosts)
    .leftJoin(userProfiles, eq(userProfiles.userId, citizenPosts.userId))
    .where(
      and(
        eq(citizenPosts.status, "active"),
        sql`${citizenPosts.latitude} IS NOT NULL`,
        sql`${citizenPosts.longitude} IS NOT NULL`
      )
    )
    .orderBy(desc(citizenPosts.createdAt))
    .limit(200);
  return rows.map((r) => ({
    id: r.post.id,
    userId: r.post.userId,
    authorName: (r.profile as any)?.displayName ?? (r.profile as any)?.username ?? "Cidadão",
    authorAvatar: (r.profile as any)?.avatarUrl ?? undefined,
    content: r.post.content,
    category: r.post.category,
    locationCity: r.post.locationCity ?? undefined,
    locationState: r.post.locationState ?? undefined,
    latitude: r.post.latitude!,
    longitude: r.post.longitude!,
    likesCount: r.post.likesCount,
    commentsCount: r.post.commentsCount,
    mediaUrls: safeParseJSON(r.post.mediaUrls, [] as string[]),
    mediaTypes: safeParseJSON(r.post.mediaTypes, [] as Array<"image" | "video">),
    createdAt: r.post.createdAt,
  }));
}
export async function getCitizenFeed(options: {
  limit?: number;
  offset?: number;
  category?: string;
  viewerUserId?: number;
}): Promise<CitizenPostWithAuthor[]> {
  const db = await getDb();
  if (!db) return [];
  const { limit = 20, offset = 0, category, viewerUserId } = options;

  const conditions: any[] = [eq(citizenPosts.status, "active")];
  if (category) conditions.push(eq(citizenPosts.category, category as any));

  const rows = await db
    .select({
      post: citizenPosts,
      profile: userProfiles,
    })
    .from(citizenPosts)
    .leftJoin(userProfiles, eq(userProfiles.userId, citizenPosts.userId))
    .where(and(...conditions))
    .orderBy(desc(citizenPosts.createdAt))
    .limit(limit)
    .offset(offset);

  const postIds = rows.map((r) => r.post.id);
  let likedPostIds = new Set<number>();
  if (viewerUserId && postIds.length > 0) {
    const likes = await db
      .select({ postId: citizenPostLikes.postId })
      .from(citizenPostLikes)
      .where(and(eq(citizenPostLikes.userId, viewerUserId), inArray(citizenPostLikes.postId, postIds)));
    likedPostIds = new Set(likes.map((l) => l.postId));
  }

  return rows.map((r) => ({
    id: r.post.id,
    userId: r.post.userId,
    authorName: (r.profile as any)?.displayName ?? (r.profile as any)?.username ?? "Cidadão",
    authorAvatar: (r.profile as any)?.avatarUrl ?? undefined,
    content: r.post.content,
    mediaUrls: safeParseJSON(r.post.mediaUrls, [] as string[]),
    mediaTypes: safeParseJSON(r.post.mediaTypes, [] as Array<"image" | "video">),
    category: r.post.category,
    locationAddress: r.post.locationAddress ?? undefined,
    locationCity: r.post.locationCity ?? undefined,
    locationState: r.post.locationState ?? undefined,
    latitude: r.post.latitude ?? null,
    longitude: r.post.longitude ?? null,
    likesCount: r.post.likesCount,
    commentsCount: r.post.commentsCount,
    sharesCount: r.post.sharesCount,
    isLiked: likedPostIds.has(r.post.id),
    createdAt: r.post.createdAt,
  }));
}
export async function getCitizenPostAuthorId(postId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select({ userId: citizenPosts.userId }).from(citizenPosts).where(eq(citizenPosts.id, postId)).limit(1);
  return row?.userId ?? null;
}
export async function toggleCitizenPostLike(postId: number, userId: number): Promise<{ liked: boolean; count: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(citizenPostLikes)
    .where(and(eq(citizenPostLikes.postId, postId), eq(citizenPostLikes.userId, userId))).limit(1);
  if (existing.length > 0) {
    await db.delete(citizenPostLikes).where(and(eq(citizenPostLikes.postId, postId), eq(citizenPostLikes.userId, userId)));
    await db.update(citizenPosts).set({ likesCount: sql`GREATEST(${citizenPosts.likesCount} - 1, 0)` }).where(eq(citizenPosts.id, postId));
    const post = await db.select({ likesCount: citizenPosts.likesCount }).from(citizenPosts).where(eq(citizenPosts.id, postId)).limit(1);
    return { liked: false, count: post[0]?.likesCount ?? 0 };
  } else {
    await db.insert(citizenPostLikes).values({ postId, userId });
    await db.update(citizenPosts).set({ likesCount: sql`${citizenPosts.likesCount} + 1` }).where(eq(citizenPosts.id, postId));
    const post = await db.select({ likesCount: citizenPosts.likesCount }).from(citizenPosts).where(eq(citizenPosts.id, postId)).limit(1);
    return { liked: true, count: post[0]?.likesCount ?? 0 };
  }
}

export async function addCitizenPostComment(postId: number, userId: number, content: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(citizenPostComments).values({ postId, userId, content });
  await db.update(citizenPosts).set({ commentsCount: sql`${citizenPosts.commentsCount} + 1` }).where(eq(citizenPosts.id, postId));
  return (result as any)[0]?.insertId ?? 0;
}

export async function getCitizenPostComments(postId: number): Promise<Array<{
  id: number; userId: number; authorName: string; content: string; createdAt: Date;
}>> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ comment: citizenPostComments, profile: userProfiles })
    .from(citizenPostComments)
    .leftJoin(userProfiles, eq(userProfiles.userId, citizenPostComments.userId))
    .where(eq(citizenPostComments.postId, postId))
    .orderBy(desc(citizenPostComments.createdAt))
    .limit(50);
  return rows.map((r) => ({
    id: r.comment.id,
    userId: r.comment.userId,
    authorName: (r.profile as any)?.displayName ?? (r.profile as any)?.username ?? "Cidadão",
    content: r.comment.content,
    createdAt: r.comment.createdAt,
  }));
}

export async function deleteCitizenPost(postId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const post = await db.select().from(citizenPosts)
    .where(and(eq(citizenPosts.id, postId), eq(citizenPosts.userId, userId))).limit(1);
  if (post.length === 0) return false;
  await db.update(citizenPosts).set({ status: "removed" }).where(eq(citizenPosts.id, postId));
  return true;
}

export async function getCitizenPostsByUser(targetUserId: number, viewerUserId?: number): Promise<CitizenPostWithAuthor[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ post: citizenPosts, profile: userProfiles })
    .from(citizenPosts)
    .leftJoin(userProfiles, eq(userProfiles.userId, citizenPosts.userId))
    .where(and(eq(citizenPosts.userId, targetUserId), eq(citizenPosts.status, "active")))
    .orderBy(desc(citizenPosts.createdAt))
    .limit(50);
  const postIds = rows.map((r) => r.post.id);
  let likedPostIds = new Set<number>();
  if (viewerUserId && postIds.length > 0) {
    const likes = await db
      .select({ postId: citizenPostLikes.postId })
      .from(citizenPostLikes)
      .where(and(eq(citizenPostLikes.userId, viewerUserId), inArray(citizenPostLikes.postId, postIds)));
    likedPostIds = new Set(likes.map((l) => l.postId));
  }
  return rows.map((r) => ({
    id: r.post.id,
    userId: r.post.userId,
    authorName: (r.profile as any)?.displayName ?? (r.profile as any)?.username ?? "Cidadão",
    authorAvatar: (r.profile as any)?.avatarUrl ?? undefined,
    content: r.post.content,
    mediaUrls: safeParseJSON(r.post.mediaUrls, [] as string[]),
    mediaTypes: safeParseJSON(r.post.mediaTypes, [] as Array<"image" | "video">),
    category: r.post.category,
    locationAddress: r.post.locationAddress ?? undefined,
    locationCity: r.post.locationCity ?? undefined,
    locationState: r.post.locationState ?? undefined,
    likesCount: r.post.likesCount,
    commentsCount: r.post.commentsCount,
    sharesCount: r.post.sharesCount,
    isLiked: likedPostIds.has(r.post.id),
    createdAt: r.post.createdAt,
  }));
}

export async function getCitizenPostById(postId: number, viewerUserId?: number): Promise<CitizenPostWithAuthor | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({ post: citizenPosts, profile: userProfiles })
    .from(citizenPosts)
    .leftJoin(userProfiles, eq(userProfiles.userId, citizenPosts.userId))
    .where(and(eq(citizenPosts.id, postId), eq(citizenPosts.status, "active")))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  let isLiked = false;
  if (viewerUserId) {
    const likes = await db
      .select({ postId: citizenPostLikes.postId })
      .from(citizenPostLikes)
      .where(and(eq(citizenPostLikes.userId, viewerUserId), eq(citizenPostLikes.postId, postId)));
    isLiked = likes.length > 0;
  }
  return {
    id: r.post.id,
    userId: r.post.userId,
    authorName: (r.profile as any)?.displayName ?? (r.profile as any)?.username ?? "Cidadão",
    authorAvatar: (r.profile as any)?.avatarUrl ?? undefined,
    content: r.post.content,
    mediaUrls: safeParseJSON(r.post.mediaUrls, [] as string[]),
    mediaTypes: safeParseJSON(r.post.mediaTypes, [] as Array<"image" | "video">),
    category: r.post.category,
    locationAddress: r.post.locationAddress ?? undefined,
    locationCity: r.post.locationCity ?? undefined,
    locationState: r.post.locationState ?? undefined,
    likesCount: r.post.likesCount,
    commentsCount: r.post.commentsCount,
    sharesCount: r.post.sharesCount,
    isLiked,
    createdAt: r.post.createdAt,
  };
}

// ─── Invite Codes ──────────────────────────────────────────────────────────────

export async function createInviteCode(opts: {
  code: string;
  createdBy: number;
  maxUses?: number;
  expiresAt?: Date;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(inviteCodes).values({
    code: opts.code,
    createdBy: opts.createdBy,
    maxUses: opts.maxUses ?? 1,
    expiresAt: opts.expiresAt,
    description: opts.description,
    isActive: true,
  });
  return opts.code;
}

export async function validateInviteCode(code: string): Promise<{ valid: boolean; reason?: string }> {
  const db = await getDb();
  if (!db) return { valid: false, reason: "Banco de dados indisponível" };
  const result = await db.select().from(inviteCodes).where(eq(inviteCodes.code, code)).limit(1);
  if (result.length === 0) return { valid: false, reason: "Código inválido" };
  const invite = result[0];
  if (!invite.isActive) return { valid: false, reason: "Código desativado" };
  if (invite.expiresAt && new Date() > invite.expiresAt) return { valid: false, reason: "Código expirado" };
  if (invite.useCount >= invite.maxUses) return { valid: false, reason: "Código já foi utilizado o número máximo de vezes" };
  return { valid: true };
}

export async function useInviteCode(code: string, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const validation = await validateInviteCode(code);
  if (!validation.valid) return false;
  await db.update(inviteCodes).set({
    useCount: sql`${inviteCodes.useCount} + 1`,
    usedBy: userId,
    usedAt: new Date(),
  }).where(eq(inviteCodes.code, code));
  return true;
}

export async function listInviteCodes(createdBy?: number) {
  const db = await getDb();
  if (!db) return [];
  if (createdBy) {
    return db.select().from(inviteCodes).where(eq(inviteCodes.createdBy, createdBy)).orderBy(desc(inviteCodes.createdAt));
  }
  return db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));
}

export async function deactivateInviteCode(code: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(inviteCodes).set({ isActive: false }).where(eq(inviteCodes.code, code));
}

// ─── Push Notification Tokens ─────────────────────────────────────────────────

export async function upsertPushToken(userId: number, token: string, platform = "expo"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Check if token already exists for this user
  const [existing] = await db
    .select({ id: pushTokens.id })
    .from(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)))
    .limit(1);
  if (existing) {
    await db.update(pushTokens).set({ updatedAt: new Date() }).where(eq(pushTokens.id, existing.id));
  } else {
    // Remove old tokens for this user (keep only the latest)
    await db.delete(pushTokens).where(eq(pushTokens.userId, userId));
    await db.insert(pushTokens).values({ userId, token, platform });
  }
}

export async function deletePushToken(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(pushTokens).where(eq(pushTokens.userId, userId));
}

export async function getPushTokensForUsers(userIds: number[]): Promise<Array<{ userId: number; token: string }>> {
  if (!userIds.length) return [];
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ userId: pushTokens.userId, token: pushTokens.token })
    .from(pushTokens)
    .where(inArray(pushTokens.userId, userIds));
  return rows;
}

// ─── Email / Password Auth ─────────────────────────────────────────────────────
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  return user ?? null;
}

export async function setUserPasswordHash(userId: number, hash: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, userId));
}

// ─── Contact Submissions ───────────────────────────────────────────────────────
export async function createContactSubmission(data: InsertContactSubmission): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.insert(contactSubmissions).values(data);
  return (result as any).insertId ?? 0;
}

export async function listContactSubmissions(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contactSubmissions)
    .orderBy(contactSubmissions.createdAt)
    .limit(limit)
    .offset(offset);
}
