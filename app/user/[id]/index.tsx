import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

const PETITION_CATEGORIES: Record<string, { label: string; emoji: string }> = {
  infrastructure: { label: "Infraestrutura", emoji: "🏗️" },
  education: { label: "Educação", emoji: "📚" },
  health: { label: "Saúde", emoji: "🏥" },
  security: { label: "Segurança", emoji: "🛡️" },
  environment: { label: "Meio Ambiente", emoji: "🌿" },
  human_rights: { label: "Direitos Humanos", emoji: "✊" },
  economy: { label: "Economia", emoji: "💰" },
  transparency: { label: "Transparência", emoji: "👁️" },
  culture: { label: "Cultura", emoji: "🎭" },
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

export default function PublicProfileScreen() {
  const colors = useColors();
  const goBack = useSmartBack("/(tabs)");
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const { user: currentUser, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.users.publicProfile.useQuery(
    { userId },
    { enabled: !!userId }
  );

  const { data: activityFeed } = trpc.users.activityFeed.useQuery(
    { userId, limit: 15 },
    { enabled: !!userId }
  );

  const { data: isFollowingData } = trpc.users.isFollowing.useQuery(
    { userId },
    { enabled: isAuthenticated && !!userId && currentUser?.id !== userId }
  );

  const followMutation = trpc.users.follow.useMutation({
    onSuccess: () => {
      utils.users.isFollowing.invalidate({ userId });
      utils.users.publicProfile.invalidate({ userId });
    },
  });

  const unfollowMutation = trpc.users.unfollow.useMutation({
    onSuccess: () => {
      utils.users.isFollowing.invalidate({ userId });
      utils.users.publicProfile.invalidate({ userId });
    },
  });

  const isOwnProfile = currentUser?.id === userId;

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!profile) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <Text style={[styles.notFound, { color: colors.muted }]}>Usuário não encontrado</Text>
        </View>
      </ScreenContainer>
    );
  }

  const roleLabel = profile.role === "admin" ? "Administrador" : profile.role === "moderator" ? "Moderador" : "Cidadão";
  const roleColor = profile.role === "admin" ? "#C0392B" : profile.role === "moderator" ? "#8E44AD" : colors.primary;

  const ACTIVITY_LABELS: Record<string, { icon: "megaphone.fill" | "hand.thumbsup.fill" | "person.3.fill" | "doc.text.fill" | "bubble.left.fill" | "person.fill"; label: string; color: string }> = {
    lobby_created: { icon: "megaphone.fill", label: "Criou um lobby", color: "#1A5276" },
    lobby_supported: { icon: "hand.thumbsup.fill", label: "Apoiou um lobby", color: "#1E8449" },
    community_joined: { icon: "person.3.fill", label: "Entrou em uma comunidade", color: "#7D3C98" },
    community_created: { icon: "person.3.fill", label: "Criou uma comunidade", color: "#7D3C98" },
    post_created: { icon: "doc.text.fill", label: "Publicou no fórum", color: "#1A5276" },
    comment_created: { icon: "bubble.left.fill", label: "Comentou em um post", color: "#117A65" },
    follow: { icon: "person.fill", label: "Seguiu um usuário", color: "#D35400" },
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <View style={[styles.navBar, { backgroundColor: colors.primary }]}>
          <BackButton
            onPress={goBack}
            variant="dark"
            label="Voltar"
          />
          <Text style={styles.navTitle}>Perfil</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.primary }]}>
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Text style={styles.avatarText}>
                {profile.name?.charAt(0)?.toUpperCase() ?? "U"}
              </Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </View>

          <Text style={styles.userName}>{profile.name ?? "Usuário"}</Text>

          {profile.bio ? (
            <Text style={styles.userBio}>{profile.bio}</Text>
          ) : null}

          {(profile.city || profile.state) ? (
            <View style={styles.locationRow}>
              <IconSymbol name="location.fill" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.locationText}>
                {[profile.city, profile.state].filter(Boolean).join(", ")}
              </Text>
            </View>
          ) : null}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.interestsScroll} contentContainerStyle={styles.interestsContent}>
              {profile.interests.map(interest => {
                const cat = PETITION_CATEGORIES[interest];
                return cat ? (
                  <View key={interest} style={styles.interestTag}>
                    <Text style={styles.interestTagText}>{cat.emoji} {cat.label}</Text>
                  </View>
                ) : null;
              })}
            </ScrollView>
          ) : null}

          {/* Follow button */}
          {isAuthenticated && !isOwnProfile && (
            <View style={styles.followBtnContainer}>
              {isFollowingData ? (
                <Pressable
                  onPress={() => unfollowMutation.mutate({ userId })}
                  style={[styles.followBtn, styles.followingBtn]}
                  disabled={unfollowMutation.isPending}
                >
                  {unfollowMutation.isPending
                    ? <ActivityIndicator size="small" color={colors.primary} />
                    : <>
                      <IconSymbol name="person.fill" size={15} color={colors.primary} />
                      <Text style={[styles.followBtnText, { color: colors.primary }]}>Seguindo</Text>
                    </>
                  }
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => followMutation.mutate({ userId })}
                  style={[styles.followBtn, { backgroundColor: "rgba(255,255,255,0.25)" }]}
                  disabled={followMutation.isPending}
                >
                  {followMutation.isPending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                      <IconSymbol name="person.fill" size={15} color="#fff" />
                      <Text style={[styles.followBtnText, { color: "#fff" }]}>Seguir</Text>
                    </>
                  }
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            style={styles.statItem}
            onPress={() => router.push({ pathname: "/user/[id]/connections", params: { id: userId, tab: "lobbies" } })}
          >
            <Text style={[styles.statNumber, { color: colors.primary }]}>{profile.lobbiesCreated ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Lobbys</Text>
          </Pressable>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Pressable
            style={styles.statItem}
            onPress={() => router.push({ pathname: "/user/[id]/connections", params: { id: userId, tab: "followers" } })}
          >
            <Text style={[styles.statNumber, { color: "#1E8449" }]}>{profile.followersCount ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Seguidores</Text>
          </Pressable>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Pressable
            style={styles.statItem}
            onPress={() => router.push({ pathname: "/user/[id]/connections", params: { id: userId, tab: "following" } })}
          >
            <Text style={[styles.statNumber, { color: "#7D3C98" }]}>{profile.followingCount ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Seguindo</Text>
          </Pressable>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#D35400" }]}>{profile.lobbiesSupported ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Apoios</Text>
          </Pressable>
        </View>

        {/* Activity Feed */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>ATIVIDADE RECENTE</Text>
          {!activityFeed || activityFeed.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="clock.fill" size={36} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>Nenhuma atividade pública</Text>
            </View>
          ) : (
            activityFeed.map(item => {
              const meta = ACTIVITY_LABELS[item.type] ?? ACTIVITY_LABELS.post_created;
              return (
                <View key={item.id} style={[styles.activityItem, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <View style={[styles.activityIcon, { backgroundColor: meta.color + "18" }]}>
                    <IconSymbol name={meta.icon} size={18} color={meta.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityLabel, { color: colors.foreground }]}>{meta.label}</Text>
                    {item.targetTitle ? (
                      <Text style={[styles.activityTarget, { color: colors.primary }]} numberOfLines={1}>
                        {item.targetTitle}
                      </Text>
                    ) : null}
                    <Text style={[styles.activityTime, { color: colors.muted }]}>
                      {formatRelativeTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 16 },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  navTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  profileHeader: { paddingBottom: 20, paddingHorizontal: 16 },
  avatarSection: { alignItems: "center", paddingTop: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 32, fontWeight: "800", color: "#FFFFFF" },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 6 },
  roleText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  userName: { fontSize: 22, fontWeight: "800", color: "#FFFFFF", textAlign: "center", marginTop: 8 },
  userBio: { fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: 4, lineHeight: 18, paddingHorizontal: 8 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, justifyContent: "center", marginTop: 6 },
  locationText: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  interestsScroll: { marginTop: 10 },
  interestsContent: { gap: 6, paddingHorizontal: 4 },
  interestTag: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  interestTagText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  followBtnContainer: { alignItems: "center", marginTop: 12 },
  followBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  followingBtn: { backgroundColor: "rgba(255,255,255,0.9)" },
  followBtnText: { fontWeight: "700", fontSize: 14 },
  statsRow: { flexDirection: "row", borderWidth: 1, paddingVertical: 14 },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  section: { padding: 16, gap: 8 },
  sectionTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  activityItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  activityIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  activityContent: { flex: 1, gap: 2 },
  activityLabel: { fontSize: 13, fontWeight: "600" },
  activityTarget: { fontSize: 13, lineHeight: 18 },
  activityTime: { fontSize: 11, marginTop: 2 },
  emptyState: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 14 },
});
