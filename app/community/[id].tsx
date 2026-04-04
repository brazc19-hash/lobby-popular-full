import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { LobbyCard } from "@/components/lobby-card";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useTour } from "@/contexts/tour-context";
import { ContextualTooltip } from "@/components/contextual-tooltip";

type ActiveTab = "forum" | "lobbies" | "members";

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const communityId = parseInt(id ?? "0");
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();
  const goBack = useSmartBack("/(tabs)");
  const utils = trpc.useUtils();

  const { currentStep, setCommunityChannelsLayout } = useTour();
  const communityChannelsViewRef = useRef<View>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("forum");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [showNewPost, setShowNewPost] = useState(false);

  const { data: community, isLoading } = trpc.communities.byId.useQuery({ id: communityId });
  const { data: isMember, refetch: refetchMember } = trpc.communities.isMember.useQuery(
    { communityId },
    { enabled: isAuthenticated }
  );
  const { data: posts, refetch: refetchPosts } = trpc.forum.posts.useQuery({ communityId });
  const { data: alliances } = trpc.communities.alliances.useQuery({ communityId });
  const { data: members } = trpc.communities.members.useQuery({ communityId });
  const { data: articles } = trpc.constitution.list.useQuery();

  const joinMutation = trpc.communities.join.useMutation({
    onSuccess: () => {
      refetchMember();
      utils.communities.byId.invalidate({ id: communityId });
    },
  });
  const leaveMutation = trpc.communities.leave.useMutation({
    onSuccess: () => {
      refetchMember();
      utils.communities.byId.invalidate({ id: communityId });
    },
  });
  const createPostMutation = trpc.forum.createPost.useMutation({
    onSuccess: () => {
      setNewPostTitle("");
      setNewPostContent("");
      setShowNewPost(false);
      refetchPosts();
    },
  });

  const handleJoin = () => {
    if (!isAuthenticated) {
      Alert.alert("Login necessário", "Faça login para entrar nesta comunidade.", [
        { text: "Cancelar", style: "cancel" },
        { text: "Entrar", onPress: () => router.push("/(tabs)/profile") },
      ]);
      return;
    }
    if (isMember) {
      Alert.alert("Sair da comunidade", "Deseja sair desta comunidade?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: () => leaveMutation.mutate({ communityId }) },
      ]);
    } else {
      joinMutation.mutate({ communityId });
    }
  };

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    createPostMutation.mutate({
      communityId,
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
    });
  };

  const getArticleNumber = (articleId: number) =>
    articles?.find(a => a.id === articleId)?.articleNumber;

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!community) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: colors.muted }]}>Comunidade não encontrada</Text>
        </View>
      </ScreenContainer>
    );
  }

  const tabs: { key: ActiveTab; label: string; icon: "bubble.left.fill" | "megaphone.fill" | "person.3.fill" }[] = [
    { key: "forum", label: "Fórum", icon: "bubble.left.fill" },
    { key: "lobbies", label: "Lobbys Aliados", icon: "megaphone.fill" },
    { key: "members", label: "Membros", icon: "person.3.fill" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <BackButton
          label="Voltar"
          variant="dark"
          onPress={goBack}
        />

        <View style={styles.headerContent}>
          <View style={[styles.communityAvatar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Text style={styles.communityAvatarText}>{community.name.charAt(0)}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.communityName} numberOfLines={1}>{community.name}</Text>
            <Text style={styles.communityTheme}>{community.theme}</Text>
          </View>
        </View>

        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <IconSymbol name="person.3.fill" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.headerStatText}>{community.memberCount} membros</Text>
          </View>
        </View>

        <Pressable
          onPress={handleJoin}
          disabled={joinMutation.isPending || leaveMutation.isPending}
          style={({ pressed }) => [
            styles.joinBtn,
            {
              backgroundColor: isMember ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.9)",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={[styles.joinBtnText, { color: isMember ? "#FFFFFF" : colors.primary }]}>
            {isMember ? "Membro" : "Entrar"}
          </Text>
        </Pressable>
      </View>

      {/* Description */}
      <View style={[styles.descriptionBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>
          {community.description}
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {tabs.map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tab,
              activeTab === tab.key && [styles.activeTab, { borderBottomColor: colors.primary }],
            ]}
          >
            <IconSymbol
              name={tab.icon}
              size={16}
              color={activeTab === tab.key ? colors.primary : colors.muted}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? colors.primary : colors.muted },
            ]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Forum Tab */}
        {activeTab === "forum" && (
          <>
          <View style={{ position: "relative", marginBottom: 4 }}>
            <ContextualTooltip
              id="community_forum_first_visit"
              message="Use @ para chamar a atenção de alguém. Clique no nome de um membro para enviar mensagem privada."
              icon="💬"
              position="bottom"
              accentColor="#7C3AED"
            />
          </View>
          <View
            ref={communityChannelsViewRef}
            style={{ gap: 12 }}
            onLayout={() => {
              if (currentStep === "community_channels" && communityChannelsViewRef.current) {
                communityChannelsViewRef.current.measure((_x, _y, width, height, pageX, pageY) => {
                  setCommunityChannelsLayout({ x: pageX, y: pageY, width, height: Math.min(height, 180) });
                });
              }
            }}
          >
            {/* New Post Button */}
            {isAuthenticated && isMember && (
              <Pressable
                onPress={() => setShowNewPost(!showNewPost)}
                style={[styles.newPostBtn, { backgroundColor: colors.primary }]}
              >
                <IconSymbol name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.newPostBtnText}>Novo Post</Text>
              </Pressable>
            )}

            {/* New Post Form */}
            {showNewPost && (
              <View style={[styles.newPostForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.postTitleInput, { color: colors.foreground, borderColor: colors.border }]}
                  placeholder="Título do post..."
                  placeholderTextColor={colors.muted}
                  value={newPostTitle}
                  onChangeText={setNewPostTitle}
                />
                <TextInput
                  style={[styles.postContentInput, { color: colors.foreground, borderColor: colors.border }]}
                  placeholder="Escreva seu post..."
                  placeholderTextColor={colors.muted}
                  value={newPostContent}
                  onChangeText={setNewPostContent}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <View style={styles.postFormActions}>
                  <Pressable
                    onPress={() => setShowNewPost(false)}
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.muted }]}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreatePost}
                    disabled={createPostMutation.isPending}
                    style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                  >
                    {createPostMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>Publicar</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {/* Posts */}
            {posts && posts.length > 0 ? (
              posts.map(post => (
                <Pressable
                  key={post.id}
                  onPress={() => router.push(`/forum/${post.id}`)}
                  style={({ pressed }) => [
                    styles.postCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  {post.isPinned && (
                    <View style={[styles.pinnedBadge, { backgroundColor: colors.accent + "20" }]}>
                      <IconSymbol name="flag.fill" size={11} color={colors.accent} />
                      <Text style={[styles.pinnedText, { color: colors.accent }]}>Fixado</Text>
                    </View>
                  )}
                  <Text style={[styles.postTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {post.title}
                  </Text>
                  <Text style={[styles.postContent, { color: colors.muted }]} numberOfLines={2}>
                    {post.content}
                  </Text>
                  <View style={styles.postFooter}>
                    <View style={styles.postStat}>
                      <IconSymbol name="bubble.left" size={13} color={colors.muted} />
                      <Text style={[styles.postStatText, { color: colors.muted }]}>
                        {post.commentCount} comentários
                      </Text>
                    </View>
                    <Text style={[styles.postDate, { color: colors.muted }]}>
                      {formatDate(post.createdAt)}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <View style={[styles.emptyState, { borderColor: colors.border }]}>
                <IconSymbol name="bubble.left" size={36} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  Nenhum post ainda. Seja o primeiro!
                </Text>
              </View>
            )}
          </View>
          </>
        )}

        {/* Lobbies Tab */}
        {activeTab === "lobbies" && (
          <View style={{ gap: 12 }}>
            {alliances && alliances.length > 0 ? (
              alliances.map(alliance => (
                <View key={alliance.id}>
                  <Text style={[styles.allianceId, { color: colors.muted }]}>
                    Lobby #{alliance.lobbyId}
                  </Text>
                </View>
              ))
            ) : (
              <View style={[styles.emptyState, { borderColor: colors.border }]}>
                <IconSymbol name="megaphone.fill" size={36} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  Nenhum lobby aliado ainda
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <View style={{ gap: 8 }}>
            {members && members.length > 0 ? (
              members.map(member => (
                <View
                  key={member.id}
                  style={[styles.memberItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[styles.memberAvatar, { backgroundColor: colors.primary + "20" }]}>
                    <IconSymbol name="person.fill" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.memberId, { color: colors.foreground }]}>
                    Membro #{member.userId}
                  </Text>
                  {member.role !== "member" && (
                    <View style={[styles.memberRoleBadge, { backgroundColor: colors.accent + "20" }]}>
                      <Text style={[styles.memberRoleText, { color: colors.accent }]}>
                        {member.role === "admin" ? "Admin" : "Mod"}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={[styles.emptyState, { borderColor: colors.border }]}>
                <IconSymbol name="person.3.fill" size={36} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>Sem membros</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 16 },
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  communityAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  communityAvatarText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  headerText: { flex: 1 },
  communityName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  communityTheme: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    marginTop: 2,
  },
  headerStats: {
    flexDirection: "row",
    gap: 12,
  },
  headerStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  headerStatText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  joinBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  joinBtnText: {
    fontWeight: "700",
    fontSize: 14,
  },
  descriptionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  newPostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  newPostBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  newPostForm: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  postTitleInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  postContentInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
  },
  postFormActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  submitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 80,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  postCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  pinnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: "700",
  },
  postTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  postContent: {
    fontSize: 13,
    lineHeight: 19,
  },
  postFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  postStatText: {
    fontSize: 13,
  },
  postDate: {
    fontSize: 12,
  },
  allianceId: {
    fontSize: 14,
    padding: 12,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  memberId: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  memberRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  memberRoleText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
