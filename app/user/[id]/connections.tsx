import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

type Tab = "followers" | "following" | "lobbies";

export default function ConnectionsScreen() {
  const colors = useColors();
  const goBack = useSmartBack("/(tabs)");
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab: string }>();
  const userId = Number(id);
  const { user: currentUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>((initialTab as Tab) ?? "followers");
  const utils = trpc.useUtils();

  const { data: profile } = trpc.users.publicProfile.useQuery({ userId }, { enabled: !!userId });
  const { data: followers, isLoading: followersLoading } = trpc.users.followers.useQuery({ userId }, { enabled: activeTab === "followers" });
  const { data: following, isLoading: followingLoading } = trpc.users.following.useQuery({ userId }, { enabled: activeTab === "following" });
  const { data: myLobbies, isLoading: lobbiesLoading } = trpc.users.myLobbies.useQuery(undefined, { enabled: activeTab === "lobbies" && currentUser?.id === userId });

  const followMutation = trpc.users.follow.useMutation({
    onSuccess: (_, vars) => {
      utils.users.isFollowing.invalidate({ userId: vars.userId });
      utils.users.followers.invalidate({ userId });
      utils.users.following.invalidate({ userId });
    },
  });

  const unfollowMutation = trpc.users.unfollow.useMutation({
    onSuccess: (_, vars) => {
      utils.users.isFollowing.invalidate({ userId: vars.userId });
      utils.users.followers.invalidate({ userId });
      utils.users.following.invalidate({ userId });
    },
  });

  const isLoading = activeTab === "followers" ? followersLoading : activeTab === "following" ? followingLoading : lobbiesLoading;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "followers", label: "Seguidores", count: profile?.followersCount ?? 0 },
    { key: "following", label: "Seguindo", count: profile?.followingCount ?? 0 },
    { key: "lobbies", label: "Lobbys", count: profile?.lobbiesCreated ?? 0 },
  ];

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Nav */}
      <View style={[styles.navBar, { backgroundColor: colors.primary }]}>
        <BackButton onPress={goBack} variant="dark" label="Voltar" />
        <Text style={styles.navTitle}>{profile?.name ?? "Usuário"}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        {tabs.map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tabBtn,
              activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text style={[styles.tabCount, { color: activeTab === tab.key ? colors.primary : colors.foreground }]}>
              {tab.count}
            </Text>
            <Text style={[styles.tabLabel, { color: activeTab === tab.key ? colors.primary : colors.muted }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === "lobbies" ? (
        <FlatList
          data={myLobbies ?? []}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol name="megaphone.fill" size={40} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>Nenhum lobby criado</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/lobby/${item.id}`)}
              style={({ pressed }) => [
                styles.lobbyItem,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={styles.lobbyContent}>
                <View style={[styles.lobbyBadge, { backgroundColor: item.category === "national" ? colors.primary + "18" : "#1E8449" + "18" }]}>
                  <Text style={[styles.lobbyBadgeText, { color: item.category === "national" ? colors.primary : "#1E8449" }]}>
                    {item.category === "national" ? "Nacional" : "Local"}
                  </Text>
                </View>
                <Text style={[styles.lobbyTitle, { color: colors.foreground }]} numberOfLines={2}>{item.title}</Text>
                <Text style={[styles.lobbyStats, { color: colors.muted }]}>{item.supportCount} apoios</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={(activeTab === "followers" ? followers : following) ?? []}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol name="person.fill" size={40} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {activeTab === "followers" ? "Nenhum seguidor ainda" : "Não está seguindo ninguém"}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = currentUser?.id === item.id;
            return (
              <Pressable
                onPress={() => router.push(`/user/${item.id}`)}
                style={({ pressed }) => [
                  styles.userItem,
                  { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View style={[styles.userAvatar, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.userAvatarText, { color: colors.primary }]}>
                    {item.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.foreground }]}>{item.name ?? "Usuário"}</Text>
                </View>
                {isAuthenticated && !isMe && (
                  <Pressable
                    onPress={() => {
                      // We'd need isFollowing state per user for full implementation
                      followMutation.mutate({ userId: item.id });
                    }}
                    style={[styles.followBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}
                  >
                    <Text style={[styles.followBtnText, { color: colors.primary }]}>Seguir</Text>
                  </Pressable>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  navTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  tabsRow: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabCount: { fontSize: 18, fontWeight: "800" },
  tabLabel: { fontSize: 12, marginTop: 2 },
  listContent: { padding: 16, gap: 8 },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 15 },
  userItem: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  userAvatarText: { fontSize: 18, fontWeight: "800" },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "600" },
  followBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  followBtnText: { fontSize: 13, fontWeight: "600" },
  lobbyItem: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1 },
  lobbyContent: { flex: 1, gap: 4 },
  lobbyBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  lobbyBadgeText: { fontSize: 11, fontWeight: "600" },
  lobbyTitle: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  lobbyStats: { fontSize: 12 },
});
