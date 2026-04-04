import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  integer, 
  timestamp, 
  boolean, 
  jsonb,
  decimal,
  uniqueIndex, 
  index 
} from "drizzle-orm/pg-core";
// â”€â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  loginMethod: varchar("login_method", { length: 20 }).notNull(),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
// â”€â”€â”€ Constitution Articles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const constitutionArticles = pgTable("constitution_articles", {
  id: serial("id").primaryKey(),
  articleNumber: varchar("articleNumber", { length: 20 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  fullText: text("fullText").notNull(),
  theme: varchar("theme", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Lobbies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const lobbies = pgTable("lobbies", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  objective: text("objective").notNull(),
  category: varchar("category", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  constitutionArticleId: integer("constitutionArticleId").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  locationAddress: text("locationAddress"),
  locationCity: varchar("locationCity", { length: 100 }),
  locationState: varchar("locationState", { length: 2 }),
  petitionCategory: varchar("petitionCategory", { length: 20 }),
  goalCount: integer("goalCount").default(1000).notNull(),
  lobbyStatus: varchar("lobbyStatus", { length: 20 }).default("mobilization").notNull(),
  evidenceUrls: text("evidenceUrls"),  // JSON array of URLs
  targetParlamentarians: text("targetParlamentarians"),  // JSON array
  supportCount: integer("supportCount").default(0).notNull(),
  viewCount: integer("viewCount").default(0).notNull(),
  isPriorityAgenda: boolean("isPriorityAgenda").default(false).notNull(),
  priorityAgendaUntil: timestamp("priorityAgendaUntil", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Lobby Supports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const lobbySupports = pgTable("lobby_supports", {
  id: serial("id").primaryKey(),
  lobbyId: integer("lobbyId").notNull(),
  userId: integer("userId").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Communities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const communities = pgTable("communities", {
  id: serial("id").primaryKey(),
  creatorId: integer("creatorId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  theme: varchar("theme", { length: 100 }).notNull(),
  memberCount: integer("memberCount").default(1).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Community Members â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const communityMembers = pgTable("community_members", {
  id: serial("id").primaryKey(),
  communityId: integer("communityId").notNull(),
  userId: integer("userId").notNull(),
  role: varchar("role", { length: 20 }).default("member").notNull(),
  joinedAt: timestamp("joinedAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Community Lobby Alliances â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const communityLobbyAlliances = pgTable("community_lobby_alliances", {
  id: serial("id").primaryKey(),
  communityId: integer("communityId").notNull(),
  lobbyId: integer("lobbyId").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Forum Posts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  communityId: integer("communityId").notNull(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  commentCount: integer("commentCount").default(0).notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Forum Comments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const forumComments = pgTable("forum_comments", {
  id: serial("id").primaryKey(),
  postId: integer("postId").notNull(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ News Items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const newsItems = pgTable("news_items", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary").notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  url: text("url"),
  imageUrl: text("imageUrl"),
  category: varchar("category", { length: 100 }),
  publishedAt: timestamp("publishedAt", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Community Channels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const communityChannels = pgTable("community_channels", {
  id: serial("id").primaryKey(),
  communityId: integer("communityId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false).notNull(),
  messageCount: integer("messageCount").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Channel Messages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const channelMessages = pgTable("channel_messages", {
  id: serial("id").primaryKey(),
  channelId: integer("channelId").notNull(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  mentions: text("mentions"),  // JSON array of user IDs mentioned
  replyToId: integer("replyToId"),
  isEdited: boolean("isEdited").default(false).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Direct Messages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("senderId").notNull(),
  receiverId: integer("receiverId").notNull(),
  content: text("content").notNull(),
  readAt: timestamp("readAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Lobby Milestones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const lobbyMilestones = pgTable("lobby_milestones", {
  id: serial("id").primaryKey(),
  lobbyId: integer("lobbyId").notNull(),
  targetCount: integer("targetCount").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  reward: varchar("reward", { length: 255 }),  // ex: "AudiÃªncia com vereador"
  reachedAt: timestamp("reachedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Lobby Timeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const lobbyTimeline = pgTable("lobby_timeline", {
  id: serial("id").primaryKey(),
  lobbyId: integer("lobbyId").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  mediaUrl: text("mediaUrl"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ User Profiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  interests: text("interests"),  // JSON array of PetitionCategory values
  followersCount: integer("followersCount").default(0).notNull(),
  followingCount: integer("followingCount").default(0).notNull(),
  lobbiesCreated: integer("lobbiesCreated").default(0).notNull(),
  lobbiesSupported: integer("lobbiesSupported").default(0).notNull(),
  communitiesJoined: integer("communitiesJoined").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ User Follows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("followerId").notNull(),
  followingId: integer("followingId").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Activity Feed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const activityFeed = pgTable("activity_feed", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  targetId: integer("targetId"),
  targetTitle: varchar("targetTitle", { length: 255 }),
  targetCategory: varchar("targetCategory", { length: 50 }),
  metadata: text("metadata"),  // JSON for extra data
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ User Interactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  lobbyId: integer("lobbyId"),
  communityId: integer("communityId"),
  action: varchar("action", { length: 20 }).notNull(),
  petitionCategory: varchar("petitionCategory", { length: 50 }),
  locationState: varchar("locationState", { length: 2 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ User Preferences â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  topCategories: text("topCategories"),  // JSON array of top categories
  topStates: text("topStates"),          // JSON array of top states
  preferredLobbyType: varchar("preferredLobbyType", { length: 20 }).default("both").notNull(),
  lastUpdated: timestamp("lastUpdated", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  { value: "education", label: "EducaÃ§Ã£o", icon: "doc.text.fill" },
  { value: "health", label: "SaÃºde", icon: "heart.fill" },
  { value: "security", label: "SeguranÃ§a PÃºblica", icon: "shield.fill" },
  { value: "environment", label: "Meio Ambiente", icon: "globe" },
  { value: "human_rights", label: "Direitos Humanos", icon: "person.3.fill" },
  { value: "economy", label: "Economia e Tributos", icon: "chart.bar.fill" },
  { value: "transparency", label: "TransparÃªncia e AnticorrupÃ§Ã£o", icon: "eye.fill" },
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

// â”€â”€â”€ Pressure Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const pressureActions = pgTable("pressure_actions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  lobbyId: integer("lobbyId").notNull(),
  channel: varchar("channel", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Smart Milestones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const smartMilestones = pgTable("smart_milestones", {
  id: serial("id").primaryKey(),
  lobbyId: integer("lobbyId").notNull(),
  targetCount: integer("targetCount").notNull(),
  action: varchar("action", { length: 500 }).notNull(),
  description: text("description"),
  achieved: boolean("achieved").default(false).notNull(),
  achievedAt: timestamp("achievedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type PressureAction = typeof pressureActions.$inferSelect;
export type InsertPressureAction = typeof pressureActions.$inferInsert;
export type SmartMilestone = typeof smartMilestones.$inferSelect;
export type InsertSmartMilestone = typeof smartMilestones.$inferInsert;

// â”€â”€â”€ Lobby Plebiscites â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const lobbyPlebiscites = pgTable("lobby_plebiscites", {
  id: serial("id").primaryKey(),
  lobbyId: integer("lobbyId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  yesVotes: integer("yesVotes").default(0).notNull(),
  noVotes: integer("noVotes").default(0).notNull(),
  activatedAt: timestamp("activatedAt", { withTimezone: true }).defaultNow().notNull(),
  endsAt: timestamp("endsAt", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Plebiscite Votes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const plebisciteVotes = pgTable("plebiscite_votes", {
  id: serial("id").primaryKey(),
  plebisciteId: integer("plebisciteId").notNull(),
  userId: integer("userId").notNull(),
  vote: varchar("vote", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ National Plebiscites â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const nationalPlebiscites = pgTable("national_plebiscites", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  yesVotes: integer("yesVotes").default(0).notNull(),
  noVotes: integer("noVotes").default(0).notNull(),
  endsAt: timestamp("endsAt", { withTimezone: true }).notNull(),
  sentToChamberAt: timestamp("sentToChamberAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ National Plebiscite Votes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const nationalPlebisciteVotes = pgTable("national_plebiscite_votes", {
  id: serial("id").primaryKey(),
  plebisciteId: integer("plebisciteId").notNull(),
  userId: integer("userId").notNull(),
  vote: varchar("vote", { length: 20 }).notNull(),
  state: varchar("state", { length: 2 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Power Metrics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const powerMetrics = pgTable("power_metrics", {
  id: serial("id").primaryKey(),
  totalCitizens: integer("totalCitizens").default(0).notNull(),
  electoratePercent: decimal("electoratePercent", { precision: 5, scale: 2 }).default("0").notNull(),
  billsInfluenced: integer("billsInfluenced").default(0).notNull(),
  victories: integer("victories").default(0).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
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

// â”€â”€â”€ User Points (Gamification) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const userPoints = pgTable("user_points", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  action: varchar("action", { length: 20 }).notNull(),
  points: integer("points").notNull(),
  referenceId: integer("referenceId"),  // lobbyId, communityId, etc.
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ User Achievements (Gamification) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  achievementKey: varchar("achievementKey", { length: 20 }).notNull(),
  unlockedAt: timestamp("unlockedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type UserPoint = typeof userPoints.$inferSelect;
export type InsertUserPoint = typeof userPoints.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

// â”€â”€â”€ Moderation Queue â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const moderationQueue = pgTable("moderation_queue", {
  id: serial("id").primaryKey(),
  contentType: varchar("contentType", { length: 20 }).notNull(),
  contentId: integer("contentId").notNull(),
  contentTitle: varchar("contentTitle", { length: 255 }),
  contentText: text("contentText"),
  userId: integer("userId").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  // IA analysis
  aiScore: decimal("aiScore", { precision: 5, scale: 2 }),  // 0-100 risk score
  aiFlags: text("aiFlags"),  // JSON array of flags: ["hate_speech", "criminal", "fake_news", "no_legal_basis"]
  aiReason: text("aiReason"),
  // Human review
  reviewedBy: integer("reviewedBy"),
  reviewedAt: timestamp("reviewedAt", { withTimezone: true }),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Moderation Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const moderationLogs = pgTable("moderation_logs", {
  id: serial("id").primaryKey(),
  queueId: integer("queueId").notNull(),
  moderatorId: integer("moderatorId").notNull(),
  action: varchar("action", { length: 20 }).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Privacy Settings (LGPD) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const privacySettings = pgTable("privacy_settings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  profileVisibility: varchar("profileVisibility", { length: 20 }).default("public").notNull(),
  showLocation: boolean("showLocation").default(true).notNull(),
  showActivity: boolean("showActivity").default(true).notNull(),
  showPoints: boolean("showPoints").default(true).notNull(),
  allowAnonymous: boolean("allowAnonymous").default(false).notNull(),
  anonymousAlias: varchar("anonymousAlias", { length: 50 }),
  dataConsentAt: timestamp("dataConsentAt", { withTimezone: true }),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

// â”€â”€â”€ Content Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const contentReports = pgTable("content_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporterId").notNull(),
  contentType: varchar("contentType", { length: 20 }).notNull(),
  contentId: integer("contentId").notNull(),
  reason: varchar("reason", { length: 20 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type ModerationQueueItem = typeof moderationQueue.$inferSelect;
export type InsertModerationQueueItem = typeof moderationQueue.$inferInsert;
export type ModerationLog = typeof moderationLogs.$inferSelect;
export type InsertModerationLog = typeof moderationLogs.$inferInsert;
export type PrivacySetting = typeof privacySettings.$inferSelect;
export type InsertPrivacySetting = typeof privacySettings.$inferInsert;
export type ContentReport = typeof contentReports.$inferSelect;
export type InsertContentReport = typeof contentReports.$inferInsert;

// â”€â”€â”€ Press / Journalists â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const pressJournalists = pgTable("press_journalists", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  outlet: varchar("outlet", { length: 200 }).notNull(),
  role: varchar("role", { length: 100 }),
  phone: varchar("phone", { length: 30 }),
  categories: text("categories"), // JSON array of categories
  regions: text("regions"),       // JSON array of states/regions
  verified: boolean("verified").default(false).notNull(),
  alertsEnabled: boolean("alertsEnabled").default(true).notNull(),
  minSupportThreshold: integer("minSupportThreshold").default(1000).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const pressAlerts = pgTable("press_alerts", {
  id: serial("id").primaryKey(),
  lobbyId: integer("lobbyId").notNull(),
  journalistId: integer("journalistId").notNull(),
  alertType: varchar("alertType", { length: 20 }).notNull(),
  sentAt: timestamp("sentAt", { withTimezone: true }).defaultNow().notNull(),
  opened: boolean("opened").default(false).notNull(),
});

export type PressJournalist = typeof pressJournalists.$inferSelect;
export type InsertPressJournalist = typeof pressJournalists.$inferInsert;
export type PressAlert = typeof pressAlerts.$inferSelect;
export type InsertPressAlert = typeof pressAlerts.$inferInsert;

// â”€â”€â”€ Citizen Feed (Feed Social de DenÃºncias CidadÃ£s) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const citizenPosts = pgTable("citizen_posts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  mediaUrls: text("mediaUrls"),       // JSON array of S3 URLs (photos/videos)
  mediaTypes: text("mediaTypes"),     // JSON array: "image" | "video"
  category: varchar("category", { length: 20 }).default("other").notNull(),
  locationAddress: text("locationAddress"),
  locationCity: varchar("locationCity", { length: 100 }),
  locationState: varchar("locationState", { length: 2 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  likesCount: integer("likesCount").default(0).notNull(),
  commentsCount: integer("commentsCount").default(0).notNull(),
  sharesCount: integer("sharesCount").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const citizenPostLikes = pgTable("citizen_post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("postId").notNull(),
  userId: integer("userId").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const citizenPostComments = pgTable("citizen_post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("postId").notNull(),
  userId: integer("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type CitizenPost = typeof citizenPosts.$inferSelect;
export type InsertCitizenPost = typeof citizenPosts.$inferInsert;
export type CitizenPostLike = typeof citizenPostLikes.$inferSelect;
export type CitizenPostComment = typeof citizenPostComments.$inferSelect;

// â”€â”€â”€ Invite Codes (Beta Fechado) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const inviteCodes = pgTable("invite_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  createdBy: integer("createdBy"),
  usedBy: integer("usedBy"),
  usedAt: timestamp("usedAt", { withTimezone: true }),
  maxUses: integer("maxUses").default(1).notNull(),
  useCount: integer("useCount").default(0).notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }),
  isActive: boolean("isActive").default(true).notNull(),
  description: varchar("description", { length: 200 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});
export type InviteCode = typeof inviteCodes.$inferSelect;
export type InsertInviteCode = typeof inviteCodes.$inferInsert;

// â”€â”€â”€ Push Notification Tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const pushTokens = pgTable("push_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  token: varchar("token", { length: 512 }).notNull(),
  platform: varchar("platform", { length: 10 }).notNull().default("expo"), // "expo" | "apns" | "fcm"
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});
export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;

// â”€â”€â”€ Contact / Interest Submissions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€â”€ Contact / Interest Submissions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  state: varchar("state", { length: 2 }),
  city: varchar("city", { length: 100 }),
  interests: text("interests"),          // JSON array of categories
  message: text("message"),
  type: varchar("type", { length: 20 }).default("tester").notNull(), // PostgreSQL nÃ£o tem mysqlEnum
  userId: integer("user_id"),            // nullable â€” linked if user is logged in
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;
// Tabela para tokens de redefiniÃ§Ã£o de senha
// Tabela para tokens de redefiniÃ§Ã£o de senha (esqueci minha senha)
export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type PasswordReset = typeof passwordResets.$inferSelect;
export type InsertPasswordReset = typeof passwordResets.$inferInsert;

