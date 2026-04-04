import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const CATEGORY_LABELS: Record<string, string> = {
  infrastructure: "Infraestrutura",
  health: "Saúde",
  education: "Educação",
  security: "Segurança",
  environment: "Meio Ambiente",
  transparency: "Transparência",
  human_rights: "Direitos Humanos",
  economy: "Economia",
  other: "Outros",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  infrastructure: "🏗️",
  health: "🏥",
  education: "📚",
  security: "🚔",
  environment: "🌿",
  transparency: "🔍",
  human_rights: "✊",
  economy: "💰",
  other: "📌",
};

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return d.toLocaleDateString("pt-BR");
}

type ProfileTab = "posts" | "lobbies";

export default function PublicProfileScreen() {
  const colors = useColors();
  const { userId: userIdParam } = useLocalSearchParams<{ userId: string }>();
  const userId = parseInt(userIdParam ?? "0", 10);
  const { user: currentUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  const utils = trpc.useUtils();

  const { data: profile, isLoading: profileLoading } = trpc.users.publicProfile.useQuery(
    { userId },
    { enabled: !!userId }
  );

  const { data: posts, isLoading: postsLoading } = trpc.citizenFeed.byUser.useQuery(
    { userId },
    { enabled: !!userId && activeTab === "posts" }
  );

  const { data: lobbies, isLoading: lobbiesLoading } = trpc.users.lobbiesByUser.useQuery(
    { userId },
    { enabled: !!userId && activeTab === "lobbies" }
  );

  const { data: isFollowingData } = trpc.users.isFollowing.useQuery(
    { userId },
    { enabled: isAuthenticated && !!currentUser?.id && userId !== currentUser?.id }
  );

  const followMutation = trpc.users.follow.useMutation({
    onSuccess: () => {
      utils.users.publicProfile.invalidate({ userId });
      utils.users.isFollowing.invalidate({ userId });
    },
  });

  const unfollowMutation = trpc.users.unfollow.useMutation({
    onSuccess: () => {
      utils.users.publicProfile.invalidate({ userId });
      utils.users.isFollowing.invalidate({ userId });
    },
  });

  const handleFollowToggle = () => {
    if (!isAuthenticated) {
      router.push("/login" as any);
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (isFollowingData) {
      unfollowMutation.mutate({ userId });
    } else {
      followMutation.mutate({ userId });
    }
  };

  const isOwnProfile = currentUser?.id === userId;
  const isFollowing = isFollowingData ?? false;
  const isMutating = followMutation.isPending || unfollowMutation.isPending;

  if (profileLoading) {
    return (
      <ScreenContainer>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <IconSymbol name="chevron.left" size={20} color="#FFFFFF" />
            <Text style={styles.backBtnText}>Voltar</Text>
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Carregando perfil...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!profile) {
    return (
      <ScreenContainer>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <IconSymbol name="chevron.left" size={20} color="#FFFFFF" />
            <Text style={styles.backBtnText}>Voltar</Text>
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <IconSymbol name="person.fill" size={48} color={colors.muted} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>Usuário não encontrado</Text>
        </View>
      </ScreenContainer>
    );
  }

  const displayName = profile.name ?? "Cidadão";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <IconSymbol name="chevron.left" size={20} color="#FFFFFF" />
          <Text style={styles.backBtnText}>Voltar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {/* Avatar */}
          <View style={styles.avatarRow}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}

            {/* Follow button (only for other users) */}
            {!isOwnProfile && isAuthenticated && (
              <Pressable
                onPress={handleFollowToggle}
                disabled={isMutating}
                style={({ pressed }) => [
                  styles.followBtn,
                  isFollowing
                    ? { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }
                    : { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 },
                  isMutating && { opacity: 0.5 },
                ]}
              >
                <Text style={[
                  styles.followBtnText,
                  isFollowing ? { color: colors.foreground } : { color: "#FFFFFF" },
                ]}>
                  {isMutating ? "..." : isFollowing ? "Seguindo" : "Seguir"}
                </Text>
              </Pressable>
            )}

            {/* Edit profile button (own profile) */}
            {isOwnProfile && (
              <Pressable
                onPress={() => router.push("/(tabs)/profile" as any)}
                style={[styles.editBtn, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <Text style={[styles.editBtnText, { color: colors.foreground }]}>Editar Perfil</Text>
              </Pressable>
            )}
          </View>

          {/* Name & Bio */}
          <Text style={[styles.profileName, { color: colors.foreground }]}>{displayName}</Text>
          {profile.bio && (
            <Text style={[styles.profileBio, { color: colors.muted }]}>{profile.bio}</Text>
          )}

          {/* Location */}
          {(profile.city || profile.state) && (
            <View style={styles.locationRow}>
              <IconSymbol name="mappin" size={14} color={colors.muted} />
              <Text style={[styles.locationText, { color: colors.muted }]}>
                {[profile.city, profile.state].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}

          {/* Stats */}
          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{profile.lobbiesCreated}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Lobbys</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{profile.lobbiesSupported}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Apoios</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{profile.followersCount}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Seguidores</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{profile.followingCount}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Seguindo</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => setActiveTab("posts")}
            style={[
              styles.tabBtn,
              activeTab === "posts" && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <IconSymbol name="photo.fill" size={16} color={activeTab === "posts" ? colors.primary : colors.muted} />
            <Text style={[styles.tabBtnText, { color: activeTab === "posts" ? colors.primary : colors.muted }]}>
              Denúncias
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("lobbies")}
            style={[
              styles.tabBtn,
              activeTab === "lobbies" && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <IconSymbol name="megaphone.fill" size={16} color={activeTab === "lobbies" ? colors.primary : colors.muted} />
            <Text style={[styles.tabBtnText, { color: activeTab === "lobbies" ? colors.primary : colors.muted }]}>
              Lobbys
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        {activeTab === "posts" && (
          <View style={styles.tabContent}>
            {postsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 32 }} />
            ) : !posts || posts.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="camera.fill" size={40} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>Nenhuma denúncia publicada</Text>
              </View>
            ) : (
              <View style={styles.postsGrid}>
                {posts.map((post) => (
                  <Pressable
                    key={post.id}
                    onPress={() => router.push(`/feed/${post.id}` as any)}
                    style={({ pressed }) => [
                      styles.postCard,
                      { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
                    ]}
                  >
                    {/* Media thumbnail */}
                    {post.mediaUrls.length > 0 ? (
                      <Image
                        source={{ uri: post.mediaUrls[0] }}
                        style={styles.postThumbnail}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.postThumbnailPlaceholder, { backgroundColor: colors.highlight }]}>
                        <Text style={{ fontSize: 24 }}>{CATEGORY_EMOJIS[post.category] ?? "📌"}</Text>
                      </View>
                    )}

                    {/* Content */}
                    <View style={styles.postCardContent}>
                      <View style={[styles.categoryPill, { backgroundColor: colors.primary + "15" }]}>
                        <Text style={[styles.categoryPillText, { color: colors.primary }]}>
                          {CATEGORY_EMOJIS[post.category]} {CATEGORY_LABELS[post.category] ?? "Outros"}
                        </Text>
                      </View>
                      <Text style={[styles.postText, { color: colors.foreground }]} numberOfLines={2}>
                        {post.content}
                      </Text>
                      {post.locationCity && (
                        <Text style={[styles.postLocation, { color: colors.muted }]} numberOfLines={1}>
                          📍 {post.locationCity}{post.locationState ? `, ${post.locationState}` : ""}
                        </Text>
                      )}
                      <View style={styles.postStats}>
                        <View style={styles.postStat}>
                          <IconSymbol name="heart.fill" size={12} color={colors.error} />
                          <Text style={[styles.postStatText, { color: colors.muted }]}>{post.likesCount}</Text>
                        </View>
                        <View style={styles.postStat}>
                          <IconSymbol name="bubble.left.fill" size={12} color={colors.muted} />
                          <Text style={[styles.postStatText, { color: colors.muted }]}>{post.commentsCount}</Text>
                        </View>
                        <Text style={[styles.postTime, { color: colors.muted }]}>
                          {formatRelativeTime(post.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === "lobbies" && (
          <View style={styles.tabContent}>
            {lobbiesLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 32 }} />
            ) : !lobbies || lobbies.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="megaphone.fill" size={40} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>Nenhum lobby criado</Text>
              </View>
            ) : (
              <View style={styles.lobbiesList}>
                {lobbies.map((lobby) => (
                  <Pressable
                    key={lobby.id}
                    onPress={() => router.push(`/lobby/${lobby.id}`)}
                    style={({ pressed }) => [
                      styles.lobbyCard,
                      { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
                    ]}
                  >
                    <View style={styles.lobbyCardHeader}>
                      <View style={[
                        styles.lobbyStatusBadge,
                        {
                          backgroundColor: lobby.status === "active"
                            ? colors.success + "20"
                            : colors.muted + "20",
                        },
                      ]}>
                        <Text style={[
                          styles.lobbyStatusText,
                          { color: lobby.status === "active" ? colors.success : colors.muted },
                        ]}>
                          {lobby.status === "active" ? "Ativo" : lobby.status === "closed" ? "Encerrado" : "Pendente"}
                        </Text>
                      </View>
                      <Text style={[styles.lobbyCategory, { color: colors.muted }]}>
                        {lobby.category === "national" ? "🇧🇷 Nacional" : "📍 Local"}
                      </Text>
                    </View>
                    <Text style={[styles.lobbyTitle, { color: colors.foreground }]} numberOfLines={2}>
                      {lobby.title}
                    </Text>
                    {(lobby.locationCity || lobby.locationState) && (
                      <Text style={[styles.lobbyLocation, { color: colors.muted }]}>
                        📍 {[lobby.locationCity, lobby.locationState].filter(Boolean).join(", ")}
                      </Text>
                    )}
                    <View style={styles.lobbyFooter}>
                      <View style={styles.lobbyStat}>
                        <IconSymbol name="hand.thumbsup.fill" size={14} color={colors.secondary} />
                        <Text style={[styles.lobbyStatText, { color: colors.secondary }]}>
                          {lobby.supportCount} apoios
                        </Text>
                      </View>
                      <Text style={[styles.lobbyTime, { color: colors.muted }]}>
                        {formatRelativeTime(lobby.createdAt)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingRight: 8,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
  },
  profileCard: {
    padding: 20,
    borderBottomWidth: 1,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  followBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  editBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabContent: {
    minHeight: 200,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
  postsGrid: {
    padding: 12,
    gap: 12,
  },
  postCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  postThumbnail: {
    width: "100%",
    height: 160,
  },
  postThumbnailPlaceholder: {
    width: "100%",
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  postCardContent: {
    padding: 12,
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  postText: {
    fontSize: 14,
    lineHeight: 20,
  },
  postLocation: {
    fontSize: 12,
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  postStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postStatText: {
    fontSize: 12,
  },
  postTime: {
    fontSize: 11,
    marginLeft: "auto",
  },
  lobbiesList: {
    padding: 12,
    gap: 10,
  },
  lobbyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  lobbyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lobbyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  lobbyStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  lobbyCategory: {
    fontSize: 12,
  },
  lobbyTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  lobbyLocation: {
    fontSize: 12,
  },
  lobbyFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lobbyStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lobbyStatText: {
    fontSize: 13,
    fontWeight: "600",
  },
  lobbyTime: {
    fontSize: 11,
  },
});
