import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["user", "moderator", "admin"]).default("user").notNull(),
  loginMethod: varchar("loginMethod", { length: 32 }).default("oauth").notNull(),
  passwordHash: text("passwordHash"),  // only set for email/password auth
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Constitution Articles ─────────────────────────────────────────────────────
export const constitutionArticles = mysqlTable("constitution_articles", {
  id: int("id").autoincrement().primaryKey(),
  articleNumber: varchar("articleNumber", { length: 20 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  fullText: text("fullText").notNull(),
  theme: varchar("theme", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Lobbies ──────────────────────────────────────────────────────────────────
export const lobbies = mysqlTable("lobbies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  objective: text("objective").notNull(),
  category: mysqlEnum("category", ["national", "local"]).notNull(),
  status: mysqlEnum("status", ["pending", "active", "rejected", "closed"]).default("active").notNull(),
  constitutionArticleId: int("constitutionArticleId").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  locationAddress: text("locationAddress"),
  locationCity: varchar("locationCity", { length: 100 }),
  locationState: varchar("locationState", { length: 2 }),
  petitionCategory: mysqlEnum("petitionCategory", [
    "infrastructure",
    "education",
    "health",
    "security",
    "environment",
    "human_rights",
    "economy",
    "transparency",
    "culture"
  ]),
  goalCount: int("goalCount").default(1000).notNull(),
  lobbyStatus: mysqlEnum("lobbyStatus", ["mobilization", "pressure", "processing", "concluded"]).default("mobilization").notNull(),
  evidenceUrls: text("evidenceUrls"),  // JSON array of URLs
  targetParlamentarians: text("targetParlamentarians"),  // JSON array
  supportCount: int("supportCount").default(0).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  isPriorityAgenda: boolean("isPriorityAgenda").default(false).notNull(),
  priorityAgendaUntil: timestamp("priorityAgendaUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Lobby Supports ───────────────────────────────────────────────────────────
export const lobbySupports = mysqlTable("lobby_supports", {
  id: int("id").autoincrement().primaryKey(),
  lobbyId: int("lobbyId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Communities ──────────────────────────────────────────────────────────────
export const communities = mysqlTable("communities", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  theme: varchar("theme", { length: 100 }).notNull(),
  memberCount: int("memberCount").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Community Members ────────────────────────────────────────────────────────
export const communityMembers = mysqlTable("community_members", {
  id: int("id").autoincrement().primaryKey(),
  communityId: int("communityId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["member", "moderator", "admin"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

// ─── Community Lobby Alliances ────────────────────────────────────────────────
export const communityLobbyAlliances = mysqlTable("community_lobby_alliances", {
  id: int("id").autoincrement().primaryKey(),
  communityId: int("communityId").notNull(),
  lobbyId: int("lobbyId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Forum Posts ──────────────────────────────────────────────────────────────
export const forumPosts = mysqlTable("forum_posts", {
  id: int("id").autoincrement().primaryKey(),
  communityId: int("communityId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  commentCount: int("commentCount").default(0).notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Forum Comments ───────────────────────────────────────────────────────────
export const forumComments = mysqlTable("forum_comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── News Items ───────────────────────────────────────────────────────────────
export const newsItems = mysqlTable("news_items", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary").notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  url: text("url"),
  imageUrl: text("imageUrl"),
  category: varchar("category", { length: 100 }),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Community Channels ─────────────────────────────────────────────────────
export const communityChannels = mysqlTable("community_channels", {
  id: int("id").autoincrement().primaryKey(),
  communityId: int("communityId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false).notNull(),
  messageCount: int("messageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Channel Messages ─────────────────────────────────────────────────────────
export const channelMessages = mysqlTable("channel_messages", {
  id: int("id").autoincrement().primaryKey(),
  channelId: int("channelId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  mentions: text("mentions"),  // JSON array of user IDs mentioned
  replyToId: int("replyToId"),
  isEdited: boolean("isEdited").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Direct Messages ──────────────────────────────────────────────────────────
export const directMessages = mysqlTable("direct_messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),
  content: text("content").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Lobby Milestones ─────────────────────────────────────────────────────────
export const lobbyMilestones = mysqlTable("lobby_milestones", {
  id: int("id").autoincrement().primaryKey(),
  lobbyId: int("lobbyId").notNull(),
  targetCount: int("targetCount").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  reward: varchar("reward", { length: 255 }),  // ex: "Audiência com vereador"
  reachedAt: timestamp("reachedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Lobby Timeline ───────────────────────────────────────────────────────────
export const lobbyTimeline = mysqlTable("lobby_timeline", {
  id: int("id").autoincrement().primaryKey(),
  lobbyId: int("lobbyId").notNull(),
  type: mysqlEnum("type", ["created", "milestone", "update", "media", "response", "concluded"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  mediaUrl: text("mediaUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── User Profiles ──────────────────────────────────────────────────────────
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  interests: text("interests"),  // JSON array of PetitionCategory values
  followersCount: int("followersCount").default(0).notNull(),
  followingCount: int("followingCount").default(0).notNull(),
  lobbiesCreated: int("lobbiesCreated").default(0).notNull(),
  lobbiesSupported: int("lobbiesSupported").default(0).notNull(),
  communitiesJoined: int("communitiesJoined").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── User Follows ─────────────────────────────────────────────────────────────
export const userFollows = mysqlTable("user_follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Activity Feed ────────────────────────────────────────────────────────────
export const activityFeed = mysqlTable("activity_feed", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "lobby_created",
    "lobby_supported",
    "community_joined",
    "community_created",
    "post_created",
    "comment_created",
    "follow",
  ]).notNull(),
  targetId: int("targetId"),
  targetTitle: varchar("targetTitle", { length: 255 }),
  targetCategory: varchar("targetCategory", { length: 50 }),
  metadata: text("metadata"),  // JSON for extra data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── User Interactions ───────────────────────────────────────────────────────
export const userInteractions = mysqlTable("user_interactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lobbyId: int("lobbyId"),
  communityId: int("communityId"),
  action: mysqlEnum("action", ["view", "support", "comment", "share", "join"]).notNull(),
  petitionCategory: varchar("petitionCategory", { length: 50 }),
  locationState: varchar("locationState", { length: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── User Preferences ────────────────────────────────────────────────────────
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  topCategories: text("topCategories"),  // JSON array of top categories
  topStates: text("topStates"),          // JSON array of top states
  preferredLobbyType: mysqlEnum("preferredLobbyType", ["national", "local", "both"]).default("both").notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ConstitutionArticle = typeof constitutionArticles.$inferSelect;
export type Lobby = typeof lobbies.$inferSelect;
export type LobbySupport = typeof lobbySupports.$inferSelect;
export type Community = typeof communities.$inferSelect;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type CommunityLobbyAlliance = typeof communityLobbyAlliances.$inferSelect;
export type ForumPost = typeof forumPosts.$inferSelect;
export type ForumComment = typeof forumComments.$inferSelect;
export type NewsItem = typeof newsItems.$inferSelect;
export type InsertLobby = typeof lobbies.$inferInsert;
export type InsertCommunity = typeof communities.$inferInsert;
export type InsertForumPost = typeof forumPosts.$inferInsert;
export type InsertForumComment = typeof forumComments.$inferInsert;
export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertUserInteraction = typeof userInteractions.$inferInsert;
export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = typeof userFollows.$inferInsert;
export type ActivityFeedItem = typeof activityFeed.$inferSelect;
export type InsertActivityFeedItem = typeof activityFeed.$inferInsert;

export const PETITION_CATEGORIES = [
  { value: "infrastructure", label: "Infraestrutura Urbana", icon: "building.columns.fill" },
  { value: "education", label: "Educação", icon: "doc.text.fill" },
  { value: "health", label: "Saúde", icon: "heart.fill" },
  { value: "security", label: "Segurança Pública", icon: "shield.fill" },
  { value: "environment", label: "Meio Ambiente", icon: "globe" },
  { value: "human_rights", label: "Direitos Humanos", icon: "person.3.fill" },
  { value: "economy", label: "Economia e Tributos", icon: "chart.bar.fill" },
  { value: "transparency", label: "Transparência e Anticorrupção", icon: "eye.fill" },
  { value: "culture", label: "Cultura e Esporte", icon: "star.fill" },
] as const;

export type PetitionCategory = typeof PETITION_CATEGORIES[number]["value"];

export type CommunityChannel = typeof communityChannels.$inferSelect;
export type InsertCommunityChannel = typeof communityChannels.$inferInsert;
export type ChannelMessage = typeof channelMessages.$inferSelect;
export type InsertChannelMessage = typeof channelMessages.$inferInsert;
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = typeof directMessages.$inferInsert;
export type LobbyMilestone = typeof lobbyMilestones.$inferSelect;
export type InsertLobbyMilestone = typeof lobbyMilestones.$inferInsert;
export type LobbyTimelineItem = typeof lobbyTimeline.$inferSelect;
export type InsertLobbyTimelineItem = typeof lobbyTimeline.$inferInsert;

// ─── Pressure Actions ────────────────────────────────────────────────────────
export const pressureActions = mysqlTable("pressure_actions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lobbyId: int("lobbyId").notNull(),
  channel: mysqlEnum("channel", ["whatsapp", "email", "twitter", "instagram", "phone", "copy"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Smart Milestones ────────────────────────────────────────────────────────
export const smartMilestones = mysqlTable("smart_milestones", {
  id: int("id").autoincrement().primaryKey(),
  lobbyId: int("lobbyId").notNull(),
  targetCount: int("targetCount").notNull(),
  action: varchar("action", { length: 500 }).notNull(),
  description: text("description"),
  achieved: boolean("achieved").default(false).notNull(),
  achievedAt: timestamp("achievedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PressureAction = typeof pressureActions.$inferSelect;
export type InsertPressureAction = typeof pressureActions.$inferInsert;
export type SmartMilestone = typeof smartMilestones.$inferSelect;
export type InsertSmartMilestone = typeof smartMilestones.$inferInsert;

// ─── Lobby Plebiscites ────────────────────────────────────────────────────────
export const lobbyPlebiscites = mysqlTable("lobby_plebiscites", {
  id: int("id").autoincrement().primaryKey(),
  lobbyId: int("lobbyId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "approved", "rejected", "expired"]).default("active").notNull(),
  yesVotes: int("yesVotes").default(0).notNull(),
  noVotes: int("noVotes").default(0).notNull(),
  activatedAt: timestamp("activatedAt").defaultNow().notNull(),
  endsAt: timestamp("endsAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Plebiscite Votes ─────────────────────────────────────────────────────────
export const plebisciteVotes = mysqlTable("plebiscite_votes", {
  id: int("id").autoincrement().primaryKey(),
  plebisciteId: int("plebisciteId").notNull(),
  userId: int("userId").notNull(),
  vote: mysqlEnum("vote", ["yes", "no"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── National Plebiscites ─────────────────────────────────────────────────────
export const nationalPlebiscites = mysqlTable("national_plebiscites", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["active", "closed", "sent_to_chamber"]).default("active").notNull(),
  yesVotes: int("yesVotes").default(0).notNull(),
  noVotes: int("noVotes").default(0).notNull(),
  endsAt: timestamp("endsAt").notNull(),
  sentToChamberAt: timestamp("sentToChamberAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── National Plebiscite Votes ────────────────────────────────────────────────
export const nationalPlebisciteVotes = mysqlTable("national_plebiscite_votes", {
  id: int("id").autoincrement().primaryKey(),
  plebisciteId: int("plebisciteId").notNull(),
  userId: int("userId").notNull(),
  vote: mysqlEnum("vote", ["yes", "no"]).notNull(),
  state: varchar("state", { length: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Power Metrics ────────────────────────────────────────────────────────────
export const powerMetrics = mysqlTable("power_metrics", {
  id: int("id").autoincrement().primaryKey(),
  totalCitizens: int("totalCitizens").default(0).notNull(),
  electoratePercent: decimal("electoratePercent", { precision: 5, scale: 2 }).default("0").notNull(),
  billsInfluenced: int("billsInfluenced").default(0).notNull(),
  victories: int("victories").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LobbyPlebiscite = typeof lobbyPlebiscites.$inferSelect;
export type InsertLobbyPlebiscite = typeof lobbyPlebiscites.$inferInsert;
export type PlebisciteVote = typeof plebisciteVotes.$inferSelect;
export type InsertPlebisciteVote = typeof plebisciteVotes.$inferInsert;
export type NationalPlebiscite = typeof nationalPlebiscites.$inferSelect;
export type InsertNationalPlebiscite = typeof nationalPlebiscites.$inferInsert;
export type NationalPlebisciteVote = typeof nationalPlebisciteVotes.$inferSelect;
export type InsertNationalPlebisciteVote = typeof nationalPlebisciteVotes.$inferInsert;
export type PowerMetric = typeof powerMetrics.$inferSelect;
export type InsertPowerMetric = typeof powerMetrics.$inferInsert;

// ─── User Points (Gamification) ─────────────────────────────────────────────
export const userPoints = mysqlTable("user_points", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: mysqlEnum("action", [
    "lobby_support",
    "lobby_create",
    "pressure_action",
    "share_card",
    "invite_friend",
    "lobby_approved",
  ]).notNull(),
  points: int("points").notNull(),
  referenceId: int("referenceId"),  // lobbyId, communityId, etc.
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── User Achievements (Gamification) ───────────────────────────────────────
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementKey: mysqlEnum("achievementKey", [
    "pressure_1000",
    "community_1000_members",
    "lobby_became_bill",
    "first_lobby",
    "first_support",
    "first_pressure",
    "invite_5_friends",
  ]).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type UserPoint = typeof userPoints.$inferSelect;
export type InsertUserPoint = typeof userPoints.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

// ─── Moderation Queue ─────────────────────────────────────────────────────────
export const moderationQueue = mysqlTable("moderation_queue", {
  id: int("id").autoincrement().primaryKey(),
  contentType: mysqlEnum("contentType", ["lobby", "post", "comment"]).notNull(),
  contentId: int("contentId").notNull(),
  contentTitle: varchar("contentTitle", { length: 255 }),
  contentText: text("contentText"),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "escalated"]).default("pending").notNull(),
  // IA analysis
  aiScore: decimal("aiScore", { precision: 5, scale: 2 }),  // 0-100 risk score
  aiFlags: text("aiFlags"),  // JSON array of flags: ["hate_speech", "criminal", "fake_news", "no_legal_basis"]
  aiReason: text("aiReason"),
  // Human review
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Moderation Logs ──────────────────────────────────────────────────────────
export const moderationLogs = mysqlTable("moderation_logs", {
  id: int("id").autoincrement().primaryKey(),
  queueId: int("queueId").notNull(),
  moderatorId: int("moderatorId").notNull(),
  action: mysqlEnum("action", ["approve", "reject", "escalate", "request_edit"]).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Privacy Settings (LGPD) ──────────────────────────────────────────────────
export const privacySettings = mysqlTable("privacy_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  profileVisibility: mysqlEnum("profileVisibility", ["public", "followers", "private"]).default("public").notNull(),
  showLocation: boolean("showLocation").default(true).notNull(),
  showActivity: boolean("showActivity").default(true).notNull(),
  showPoints: boolean("showPoints").default(true).notNull(),
  allowAnonymous: boolean("allowAnonymous").default(false).notNull(),
  anonymousAlias: varchar("anonymousAlias", { length: 50 }),
  dataConsentAt: timestamp("dataConsentAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Content Reports ──────────────────────────────────────────────────────────
export const contentReports = mysqlTable("content_reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull(),
  contentType: mysqlEnum("contentType", ["lobby", "post", "comment", "user"]).notNull(),
  contentId: int("contentId").notNull(),
  reason: mysqlEnum("reason", [
    "hate_speech",
    "criminal_content",
    "fake_news",
    "spam",
    "harassment",
    "other",
  ]).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "reviewed", "dismissed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ModerationQueueItem = typeof moderationQueue.$inferSelect;
export type InsertModerationQueueItem = typeof moderationQueue.$inferInsert;
export type ModerationLog = typeof moderationLogs.$inferSelect;
export type InsertModerationLog = typeof moderationLogs.$inferInsert;
export type PrivacySetting = typeof privacySettings.$inferSelect;
export type InsertPrivacySetting = typeof privacySettings.$inferInsert;
export type ContentReport = typeof contentReports.$inferSelect;
export type InsertContentReport = typeof contentReports.$inferInsert;

// ─── Press / Journalists ─────────────────────────────────────────────────────
export const pressJournalists = mysqlTable("press_journalists", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  outlet: varchar("outlet", { length: 200 }).notNull(),
  role: varchar("role", { length: 100 }),
  phone: varchar("phone", { length: 30 }),
  categories: text("categories"), // JSON array of categories
  regions: text("regions"),       // JSON array of states/regions
  verified: boolean("verified").default(false).notNull(),
  alertsEnabled: boolean("alertsEnabled").default(true).notNull(),
  minSupportThreshold: int("minSupportThreshold").default(1000).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const pressAlerts = mysqlTable("press_alerts", {
  id: int("id").autoincrement().primaryKey(),
  lobbyId: int("lobbyId").notNull(),
  journalistId: int("journalistId").notNull(),
  alertType: mysqlEnum("alertType", [
    "new_lobby",
    "milestone_reached",
    "priority_agenda",
    "bill_submitted",
  ]).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  opened: boolean("opened").default(false).notNull(),
});

export type PressJournalist = typeof pressJournalists.$inferSelect;
export type InsertPressJournalist = typeof pressJournalists.$inferInsert;
export type PressAlert = typeof pressAlerts.$inferSelect;
export type InsertPressAlert = typeof pressAlerts.$inferInsert;

// ─── Citizen Feed (Feed Social de Denúncias Cidadãs) ─────────────────────────
export const citizenPosts = mysqlTable("citizen_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  mediaUrls: text("mediaUrls"),       // JSON array of S3 URLs (photos/videos)
  mediaTypes: text("mediaTypes"),     // JSON array: "image" | "video"
  category: mysqlEnum("category", [
    "infrastructure",
    "education",
    "health",
    "security",
    "environment",
    "human_rights",
    "economy",
    "transparency",
    "culture",
    "other",
  ]).default("other").notNull(),
  locationAddress: text("locationAddress"),
  locationCity: varchar("locationCity", { length: 100 }),
  locationState: varchar("locationState", { length: 2 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  likesCount: int("likesCount").default(0).notNull(),
  commentsCount: int("commentsCount").default(0).notNull(),
  sharesCount: int("sharesCount").default(0).notNull(),
  status: mysqlEnum("status", ["active", "hidden", "removed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const citizenPostLikes = mysqlTable("citizen_post_likes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const citizenPostComments = mysqlTable("citizen_post_comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CitizenPost = typeof citizenPosts.$inferSelect;
export type InsertCitizenPost = typeof citizenPosts.$inferInsert;
export type CitizenPostLike = typeof citizenPostLikes.$inferSelect;
export type CitizenPostComment = typeof citizenPostComments.$inferSelect;

// ─── Invite Codes (Beta Fechado) ──────────────────────────────────────────────
export const inviteCodes = mysqlTable("invite_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  createdBy: int("createdBy"),
  usedBy: int("usedBy"),
  usedAt: timestamp("usedAt"),
  maxUses: int("maxUses").default(1).notNull(),
  useCount: int("useCount").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  description: varchar("description", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InviteCode = typeof inviteCodes.$inferSelect;
export type InsertInviteCode = typeof inviteCodes.$inferInsert;

// ─── Push Notification Tokens ─────────────────────────────────────────────────
export const pushTokens = mysqlTable("push_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 512 }).notNull(),
  platform: varchar("platform", { length: 10 }).notNull().default("expo"), // "expo" | "apns" | "fcm"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;

// ─── Contact / Interest Submissions ───────────────────────────────────────────
export const contactSubmissions = mysqlTable("contact_submissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  state: varchar("state", { length: 2 }),
  city: varchar("city", { length: 100 }),
  interests: text("interests"),          // JSON array of categories
  message: text("message"),
  type: mysqlEnum("type", ["tester", "partner", "press", "other"]).default("tester").notNull(),
  userId: int("userId"),                 // nullable — linked if user is logged in
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;
