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
import { router } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useTour } from "@/contexts/tour-context";

const PETITION_CATEGORIES = [
  { value: "infrastructure", label: "Infraestrutura", emoji: "🏗️" },
  { value: "education", label: "Educação", emoji: "📚" },
  { value: "health", label: "Saúde", emoji: "🏥" },
  { value: "security", label: "Segurança", emoji: "🛡️" },
  { value: "environment", label: "Meio Ambiente", emoji: "🌿" },
  { value: "human_rights", label: "Direitos Humanos", emoji: "✊" },
  { value: "economy", label: "Economia", emoji: "💰" },
  { value: "transparency", label: "Transparência", emoji: "👁️" },
  { value: "culture", label: "Cultura", emoji: "🎭" },
];

const ACTIVITY_LABELS: Record<string, { icon: "megaphone.fill" | "hand.thumbsup.fill" | "person.3.fill" | "doc.text.fill" | "bubble.left.fill" | "person.fill"; label: string; color: string }> = {
  lobby_created: { icon: "megaphone.fill", label: "Criou um lobby", color: "#1A5276" },
  lobby_supported: { icon: "hand.thumbsup.fill", label: "Apoiou um lobby", color: "#1E8449" },
  community_joined: { icon: "person.3.fill", label: "Entrou em uma comunidade", color: "#7D3C98" },
  community_created: { icon: "person.3.fill", label: "Criou uma comunidade", color: "#7D3C98" },
  post_created: { icon: "doc.text.fill", label: "Publicou no fórum", color: "#1A5276" },
  comment_created: { icon: "bubble.left.fill", label: "Comentou em um post", color: "#117A65" },
  follow: { icon: "person.fill", label: "Seguiu um usuário", color: "#D35400" },
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

export default function ProfileScreen() {
  const colors = useColors();
  const { user, isAuthenticated, loading, logout, startOAuthLogin } = useAuth();
  const { startTour } = useTour();
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"activity" | "lobbies" | "communities" | "posts">("activity");
  const { data: myPosts, isLoading: postsLoading } = trpc.citizenFeed.byUser.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: isAuthenticated && !!user?.id && activeTab === "posts" }
  );

  const utils = trpc.useUtils();

  const { data: profile, isLoading: profileLoading } = trpc.users.profile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: activityFeed, isLoading: activityLoading } = trpc.users.activityFeed.useQuery(
    { userId: user?.id ?? 0, limit: 20 },
    { enabled: isAuthenticated && !!user?.id }
  );

  const { data: myLobbies } = trpc.users.myLobbies.useQuery(undefined, { enabled: isAuthenticated });
  const { data: supportedLobbies } = trpc.users.supportedLobbies.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myCommunities } = trpc.users.myCommunities.useQuery(undefined, { enabled: isAuthenticated });
  const { data: gamStats } = trpc.gamification.myStats.useQuery(undefined, { enabled: isAuthenticated, retry: false });

  const updateProfileMutation = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      utils.users.profile.invalidate();
      setEditMode(false);
    },
  });

  const handleEditOpen = () => {
    setEditName(user?.name ?? "");
    setEditBio(profile?.bio ?? "");
    setEditCity(profile?.city ?? "");
    setEditState(profile?.state ?? "");
    setEditInterests(profile?.interests ?? []);
    setEditMode(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      name: editName || undefined,
      bio: editBio || undefined,
      city: editCity || undefined,
      state: editState || undefined,
      interests: editInterests,
    });
  };

  const toggleInterest = (value: string) => {
    setEditInterests(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  if (loading || profileLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
        </View>
        <ScrollView contentContainerStyle={styles.loginContainer}>
          <View style={[styles.loginCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.loginIcon, { backgroundColor: colors.primary + "15" }]}>
              <IconSymbol name="person.fill" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.loginTitle, { color: colors.foreground }]}>Faça login para participar</Text>
            <Text style={[styles.loginSubtitle, { color: colors.muted }]}>
              Com uma conta, você pode criar campanhas, apoiar causas, seguir outros cidadãos e participar de comunidades.
            </Text>
            {/* Unified login button */}
            <Pressable
              onPress={() => router.push("/login" as any)}
              style={({ pressed }) => [styles.loginBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <IconSymbol name="person.fill" size={18} color="#FFFFFF" />
              <Text style={styles.loginBtnText}>Entrar / Criar conta</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/contact" as any)}
              style={({ pressed }) => [styles.loginBtn, { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={[styles.loginBtnText, { color: colors.foreground }]}>🧪 Quero ser testador</Text>
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.loginNote, { color: colors.muted }]}>
              Ao fazer login, você concorda com os Termos de Uso e confirma que utilizará o aplicativo apenas para fins legais e democráticos, conforme a Constituição Federal.
            </Text>
          </View>
          {[
            { icon: "megaphone.fill" as const, text: "Crie e gerencie lobbys" },
            { icon: "hand.thumbsup.fill" as const, text: "Apoie causas importantes" },
            { icon: "person.3.fill" as const, text: "Siga outros cidadãos" },
            { icon: "building.columns.fill" as const, text: "Acesse a base legal da CF" },
          ].map((f, i) => (
            <View key={i} style={[styles.featureItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name={f.icon} size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f.text}</Text>
            </View>
          ))}
        </ScrollView>
      </ScreenContainer>
    );
  }

  const roleLabel = user?.role === "admin" ? "Administrador" : user?.role === "moderator" ? "Moderador" : "Cidadão";
  const roleColor = user?.role === "admin" ? "#C0392B" : user?.role === "moderator" ? "#8E44AD" : colors.primary;

  // Edit mode screen
  if (editMode) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={[styles.editHeader, { backgroundColor: colors.primary }]}>
          <Pressable onPress={() => setEditMode(false)} style={styles.editBackBtn}>
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#fff" />
            <Text style={styles.editBackText}>Cancelar</Text>
          </Pressable>
          <Text style={styles.editHeaderTitle}>Editar Perfil</Text>
          <Pressable
            onPress={handleSaveProfile}
            style={[styles.editSaveBtn, { opacity: updateProfileMutation.isPending ? 0.6 : 1 }]}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.editSaveText}>Salvar</Text>
            }
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.editContent}>
          {/* Avatar placeholder */}
          <View style={styles.editAvatarSection}>
            <View style={[styles.editAvatar, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.editAvatarText, { color: colors.primary }]}>
                {(editName || user?.name)?.charAt(0)?.toUpperCase() ?? "U"}
              </Text>
            </View>
          </View>

          <View style={styles.editField}>
            <Text style={[styles.editLabel, { color: colors.muted }]}>Nome</Text>
            <TextInput
              style={[styles.editInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Seu nome completo"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.editField}>
            <Text style={[styles.editLabel, { color: colors.muted }]}>Bio</Text>
            <TextInput
              style={[styles.editInput, styles.editTextArea, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Fale um pouco sobre você e suas causas..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.editRow}>
            <View style={[styles.editField, { flex: 2 }]}>
              <Text style={[styles.editLabel, { color: colors.muted }]}>Cidade</Text>
              <TextInput
                style={[styles.editInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={editCity}
                onChangeText={setEditCity}
                placeholder="Sua cidade"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={[styles.editField, { flex: 1 }]}>
              <Text style={[styles.editLabel, { color: colors.muted }]}>Estado</Text>
              <TextInput
                style={[styles.editInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={editState}
                onChangeText={t => setEditState(t.toUpperCase().slice(0, 2))}
                placeholder="SP"
                placeholderTextColor={colors.muted}
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.editField}>
            <Text style={[styles.editLabel, { color: colors.muted }]}>Interesses Cívicos</Text>
            <Text style={[styles.editHint, { color: colors.muted }]}>Selecione as áreas que mais importam para você</Text>
            <View style={styles.interestGrid}>
              {PETITION_CATEGORIES.map(cat => {
                const active = editInterests.includes(cat.value);
                return (
                  <Pressable
                    key={cat.value}
                    onPress={() => toggleInterest(cat.value)}
                    style={[
                      styles.interestChip,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.interestEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.interestLabel, { color: active ? "#fff" : colors.foreground }]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.primary }]}>
          <View style={styles.profileHeaderTop}>
            <Pressable
              onPress={handleEditOpen}
              style={[styles.editProfileBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
            >
              <IconSymbol name="pencil" size={16} color="#fff" />
              <Text style={styles.editProfileBtnText}>Editar</Text>
            </Pressable>
          </View>

          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </View>

          <Text style={styles.userName}>{user?.name ?? "Usuário"}</Text>
          {profile?.bio ? (
            <Text style={styles.userBio}>{profile.bio}</Text>
          ) : null}
          {(profile?.city || profile?.state) ? (
            <View style={styles.locationRow}>
              <IconSymbol name="location.fill" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.locationText}>
                {[profile.city, profile.state].filter(Boolean).join(", ")}
              </Text>
            </View>
          ) : null}

          {/* Interests */}
          {profile?.interests && profile.interests.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.interestsScroll} contentContainerStyle={styles.interestsContent}>
              {profile.interests.map(interest => {
                const cat = PETITION_CATEGORIES.find(c => c.value === interest);
                return cat ? (
                  <View key={interest} style={styles.interestTag}>
                    <Text style={styles.interestTagText}>{cat.emoji} {cat.label}</Text>
                  </View>
                ) : null;
              })}
            </ScrollView>
          ) : null}
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            style={styles.statItem}
            onPress={() => router.push({ pathname: "/user/[id]/connections", params: { id: user?.id ?? 0, tab: "lobbies" } })}
          >
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {profile?.lobbiesCreated ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Lobbys</Text>
          </Pressable>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Pressable
            style={styles.statItem}
            onPress={() => router.push({ pathname: "/user/[id]/connections", params: { id: user?.id ?? 0, tab: "followers" } })}
          >
            <Text style={[styles.statNumber, { color: "#1E8449" }]}>
              {profile?.followersCount ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Seguidores</Text>
          </Pressable>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Pressable
            style={styles.statItem}
            onPress={() => router.push({ pathname: "/user/[id]/connections", params: { id: user?.id ?? 0, tab: "following" } })}
          >
            <Text style={[styles.statNumber, { color: "#7D3C98" }]}>
              {profile?.followingCount ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Seguindo</Text>
          </Pressable>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#D35400" }]}>
              {profile?.lobbiesSupported ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Apoios</Text>
          </Pressable>
        </View>

        {/* Gamification Badge */}
        {gamStats && (
          <Pressable
            onPress={() => router.push("/gamification")}
            style={({ pressed }) => [{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: gamStats.level.color + "15",
              borderRadius: 12,
              marginHorizontal: 16,
              marginTop: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: gamStats.level.color + "40",
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text style={{ fontSize: 28, marginRight: 10 }}>{gamStats.level.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: gamStats.level.color }}>
                {gamStats.level.title} • Nível {gamStats.level.level}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                {gamStats.totalPoints.toLocaleString("pt-BR")} pontos
                {gamStats.nextLevel ? ` • ${gamStats.progressToNext}% para ${gamStats.nextLevel.title}` : " • Nível máximo!"}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: gamStats.level.color, fontWeight: "600" }}>Ver detalhes ›</Text>
          </Pressable>
        )}

        {/* Activity Tabs */}
        <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
          {([
            { key: "activity", label: "Atividade" },
            { key: "lobbies", label: "Lobbys" },
            { key: "communities", label: "Comunidades" },
            { key: "posts", label: "Posts" },
          ] as const).map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabBtn,
                activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Text style={[
                styles.tabBtnText,
                { color: activeTab === tab.key ? colors.primary : colors.muted },
              ]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === "activity" && (
          <View style={styles.tabContent}>
            {activityLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
            ) : !activityFeed || activityFeed.length === 0 ? (
              <View style={styles.emptyTab}>
                <IconSymbol name="clock.fill" size={40} color={colors.muted} />
                <Text style={[styles.emptyTabText, { color: colors.muted }]}>Nenhuma atividade ainda</Text>
                <Text style={[styles.emptyTabHint, { color: colors.muted }]}>Apoie lobbys, entre em comunidades e publique posts para ver seu histórico aqui.</Text>
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
        )}

        {activeTab === "lobbies" && (
          <View style={styles.tabContent}>
            {(!myLobbies || myLobbies.length === 0) ? (
              <View style={styles.emptyTab}>
                <IconSymbol name="megaphone.fill" size={40} color={colors.muted} />
                <Text style={[styles.emptyTabText, { color: colors.muted }]}>Nenhum lobby criado</Text>
                <Pressable
                  onPress={() => router.push("/(tabs)/create")}
                  style={[styles.emptyTabBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.emptyTabBtnText}>Criar Campanha</Text>
                </Pressable>
              </View>
            ) : (
              myLobbies.map(lobby => (
                <Pressable
                  key={lobby.id}
                  onPress={() => router.push(`/lobby/${lobby.id}`)}
                  style={({ pressed }) => [
                    styles.lobbyItem,
                    { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <View style={styles.lobbyItemContent}>
                    <View style={[styles.lobbyTypeBadge, { backgroundColor: lobby.category === "national" ? colors.primary + "18" : "#1E8449" + "18" }]}>
                      <Text style={[styles.lobbyTypeBadgeText, { color: lobby.category === "national" ? colors.primary : "#1E8449" }]}>
                        {lobby.category === "national" ? "Nacional" : "Local"}
                      </Text>
                    </View>
                    <Text style={[styles.lobbyItemTitle, { color: colors.foreground }]} numberOfLines={2}>{lobby.title}</Text>
                    <Text style={[styles.lobbyItemStats, { color: colors.muted }]}>
                      {lobby.supportCount} apoios · {lobby.status === "active" ? "Ativo" : lobby.status === "pending" ? "Pendente" : "Encerrado"}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </Pressable>
              ))
            )}

            {supportedLobbies && supportedLobbies.length > 0 && (
              <>
                <Text style={[styles.sectionDividerLabel, { color: colors.muted }]}>LOBBYS APOIADOS</Text>
                {supportedLobbies.map(lobby => (
                  <Pressable
                    key={lobby.id}
                    onPress={() => router.push(`/lobby/${lobby.id}`)}
                    style={({ pressed }) => [
                      styles.lobbyItem,
                      { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <View style={styles.lobbyItemContent}>
                      <View style={[styles.lobbyTypeBadge, { backgroundColor: "#1E8449" + "18" }]}>
                        <Text style={[styles.lobbyTypeBadgeText, { color: "#1E8449" }]}>Apoiado</Text>
                      </View>
                      <Text style={[styles.lobbyItemTitle, { color: colors.foreground }]} numberOfLines={2}>{lobby.title}</Text>
                      <Text style={[styles.lobbyItemStats, { color: colors.muted }]}>{lobby.supportCount} apoios</Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                  </Pressable>
                ))}
              </>
            )}
          </View>
        )}

        {activeTab === "communities" && (
          <View style={styles.tabContent}>
            {(!myCommunities || myCommunities.length === 0) ? (
              <View style={styles.emptyTab}>
                <IconSymbol name="person.3.fill" size={40} color={colors.muted} />
                <Text style={[styles.emptyTabText, { color: colors.muted }]}>Nenhuma comunidade</Text>
                <Pressable
                  onPress={() => router.push("/(tabs)/communities")}
                  style={[styles.emptyTabBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.emptyTabBtnText}>Explorar Comunidades</Text>
                </Pressable>
              </View>
            ) : (
              myCommunities.map(community => (
                <Pressable
                  key={community.id}
                  onPress={() => router.push(`/community/${community.id}`)}
                  style={({ pressed }) => [
                    styles.lobbyItem,
                    { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <View style={styles.lobbyItemContent}>
                    <Text style={[styles.lobbyItemTitle, { color: colors.foreground }]} numberOfLines={1}>{community.name}</Text>
                    <Text style={[styles.lobbyItemStats, { color: colors.muted }]}>
                      {community.memberCount} membros · {community.theme}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </Pressable>
              ))
            )}
          </View>
        )}

        {activeTab === "posts" && (
          <View style={styles.tabContent}>
            {postsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
            ) : (!myPosts || myPosts.length === 0) ? (
              <View style={styles.emptyTab}>
                <Text style={{ fontSize: 36 }}>📸</Text>
                <Text style={[styles.emptyTabText, { color: colors.foreground }]}>Nenhum post ainda</Text>
                <Text style={[styles.emptyTabHint, { color: colors.muted }]}>Compartilhe problemas da sua rua, bairro ou cidade no Feed Cidadão.</Text>
                <Pressable
                  onPress={() => router.push("/feed/create")}
                  style={({ pressed }) => [styles.emptyTabBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
                >
                  <Text style={styles.emptyTabBtnText}>Criar Post</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2, padding: 2 }}>
                {myPosts.map(post => (
                  <Pressable
                    key={post.id}
                    onPress={() => router.push(`/feed/${post.id}`)}
                    style={({ pressed }) => ({
                      width: "32%",
                      aspectRatio: 1,
                      backgroundColor: colors.surface,
                      borderRadius: 4,
                      overflow: "hidden",
                      opacity: pressed ? 0.8 : 1,
                      justifyContent: "center",
                      alignItems: "center",
                      padding: 4,
                    })}
                  >
                    {post.mediaUrls && post.mediaUrls.length > 0 ? (
                      <View style={{ width: "100%", height: "100%", backgroundColor: colors.border, borderRadius: 4, justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ fontSize: 28 }}>🖼️</Text>
                      </View>
                    ) : (
                      <View style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center", padding: 4 }}>
                        <Text style={{ fontSize: 10, color: colors.muted, textAlign: "center" }} numberOfLines={3}>{post.content}</Text>
                      </View>
                    )}
                    <View style={{ position: "absolute", bottom: 4, left: 4, flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <Text style={{ fontSize: 9, color: colors.muted }}>❤️ {post.likesCount}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Funcionalidades */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.muted }]}>FUNCIONALIDADES</Text>
          <Pressable
            onPress={() => startTour()}
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: "#1E3A5F", borderColor: "#1E3A5F", opacity: pressed ? 0.8 : 1, marginBottom: 8 },
            ]}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <Text style={{ fontSize: 18 }}>🎯</Text>
            </View>
            <Text style={[styles.menuLabel, { color: "#FFFFFF", fontWeight: "700" }]}>Fazer Tour Guiado</Text>
            <IconSymbol name="chevron.right" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
          <Pressable
            onPress={() => router.push("/i18n-settings")}
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: "#2D7D4615" }]}>
              <Text style={{ fontSize: 18 }}>🌐</Text>
            </View>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Idioma do App</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/saved-lobbies")}
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1, marginTop: 8 },
            ]}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: "#1E3A5F15" }]}>
              <Text style={{ fontSize: 18 }}>📥</Text>
            </View>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Lobbys Salvos (Offline)</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/press")}
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1, marginTop: 8 },
            ]}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: "#F59E0B15" }]}>
              <Text style={{ fontSize: 18 }}>📰</Text>
            </View>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Alertas para Imprensa</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </Pressable>
        </View>

        {/* Privacy Settings */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.muted }]}>PRIVACIDADE E DADOS</Text>
          <Pressable
            onPress={() => router.push("/privacy")}
            style={({ pressed }) => [
              styles.menuItem,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: "#1E3A5F15" }]}>
              <IconSymbol name="lock.fill" size={20} color="#1E3A5F" />
            </View>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Privacidade e Dados (LGPD)</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </Pressable>
        </View>

        {/* Moderation — admin/moderator or level 4+ */}
        {(user?.role === "admin" || user?.role === "moderator" || (gamStats?.level?.level ?? 0) >= 4) && (
          <View style={styles.menuSection}>
            <Text style={[styles.menuSectionTitle, { color: colors.muted }]}>COMITÊ DE TRANSPARÊNCIA</Text>
            <Pressable
              onPress={() => router.push("/moderation")}
              style={({ pressed }) => [
                styles.menuItem,
                { backgroundColor: colors.surface, borderColor: "#8B5CF640", opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: "#8B5CF615" }]}>
                <IconSymbol name="shield.fill" size={20} color="#8B5CF6" />
              </View>
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>Painel de Moderação</Text>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>
          </View>
        )}

        {/* Admin Panel */}
        {(user?.role === "admin" || user?.role === "moderator") && (
          <View style={styles.menuSection}>
            <Text style={[styles.menuSectionTitle, { color: colors.muted }]}>ADMINISTRAÇÃO</Text>
            <Pressable
              onPress={() => router.push("/admin")}
              style={({ pressed }) => [
                styles.menuItem,
                { backgroundColor: colors.surface, borderColor: "#C0392B40", opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: "#C0392B15" }]}>
                <IconSymbol name="shield.fill" size={20} color="#C0392B" />
              </View>
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>Painel Admin</Text>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>
          </View>
        )}

        {/* Logout */}
        <View style={styles.menuSection}>
          <Pressable
            onPress={() => {
              Alert.alert("Sair", "Deseja realmente sair da sua conta?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Sair", style: "destructive", onPress: logout },
              ]);
            }}
            style={({ pressed }) => [
              styles.logoutBtn,
              { backgroundColor: "#C0392B12", borderColor: "#C0392B30", opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <IconSymbol name="arrow.left" size={18} color="#C0392B" />
            <Text style={[styles.logoutText, { color: "#C0392B" }]}>Sair da Conta</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  loginContainer: { padding: 16, gap: 12 },
  loginCard: { borderRadius: 20, padding: 24, borderWidth: 1, alignItems: "center", gap: 12 },
  loginIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  loginTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  loginSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 28, marginTop: 4, width: "100%", justifyContent: "center" },
  loginBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  divider: { height: 1, width: "100%" },
  loginNote: { fontSize: 12, textAlign: "center", lineHeight: 18 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  featureText: { fontSize: 14, fontWeight: "500" },

  // Profile header
  profileHeader: { paddingBottom: 20, paddingHorizontal: 16 },
  profileHeaderTop: { paddingTop: 12, alignItems: "flex-end" },
  editProfileBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  editProfileBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  avatarSection: { alignItems: "center", marginTop: 4 },
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

  // Stats
  statsRow: { flexDirection: "row", borderWidth: 1, borderRadius: 0, paddingVertical: 14 },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, marginVertical: 4 },

  // Tabs
  tabsRow: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 16 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabBtnText: { fontSize: 14, fontWeight: "600" },
  tabContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8 },

  // Activity
  activityItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  activityIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  activityContent: { flex: 1, gap: 2 },
  activityLabel: { fontSize: 13, fontWeight: "600" },
  activityTarget: { fontSize: 13, lineHeight: 18 },
  activityTime: { fontSize: 11, marginTop: 2 },

  // Lobby/Community items
  lobbyItem: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1 },
  lobbyItemContent: { flex: 1, gap: 4 },
  lobbyTypeBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  lobbyTypeBadgeText: { fontSize: 11, fontWeight: "600" },
  lobbyItemTitle: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  lobbyItemStats: { fontSize: 12 },
  sectionDividerLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 12, marginBottom: 4 },

  // Empty states
  emptyTab: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyTabText: { fontSize: 15, fontWeight: "600" },
  emptyTabHint: { fontSize: 13, textAlign: "center", lineHeight: 18, paddingHorizontal: 16 },
  emptyTabBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 4 },
  emptyTabBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Menu
  menuSection: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  menuSectionTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  menuIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, justifyContent: "center" },
  logoutText: { fontWeight: "700", fontSize: 15 },

  // Edit mode
  editHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  editBackBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  editBackText: { color: "#fff", fontSize: 14 },
  editHeaderTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  editSaveBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 14 },
  editSaveText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  editContent: { padding: 16, gap: 16 },
  editAvatarSection: { alignItems: "center", paddingVertical: 8 },
  editAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  editAvatarText: { fontSize: 32, fontWeight: "800" },
  editField: { gap: 6 },
  editRow: { flexDirection: "row", gap: 12 },
  editLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  editHint: { fontSize: 12, marginTop: -2 },
  editInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  editTextArea: { minHeight: 80, textAlignVertical: "top" },
  interestGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  interestChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  interestEmoji: { fontSize: 14 },
  interestLabel: { fontSize: 13, fontWeight: "500" },
  // OR divider between login buttons
  orDivider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 12, fontWeight: "600" },
});
