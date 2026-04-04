import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

// Brazil center coordinates
const BRAZIL_CENTER = {
  latitude: -14.235,
  longitude: -51.9253,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

// Category colors for Feed markers
const CATEGORY_COLORS: Record<string, string> = {
  infrastructure: "#E8A020",
  health: "#E74C3C",
  education: "#3B6EA8",
  security: "#8E44AD",
  environment: "#2D7D46",
  transparency: "#1ABC9C",
  human_rights: "#E91E63",
  economy: "#FF9800",
  other: "#607D8B",
};

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

interface SelectedLobby {
  id: number;
  title: string;
  supportCount: number;
  locationCity?: string | null;
  locationState?: string | null;
  category: string;
}

interface SelectedPost {
  id: number;
  content: string;
  category: string;
  authorName: string;
  authorAvatar?: string;
  locationCity?: string;
  locationState?: string;
  likesCount: number;
  commentsCount: number;
  mediaUrls: string[];
}

type MapTab = "lobbies" | "reports";

export default function ExploreScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<MapTab>("lobbies");
  const [selectedLobby, setSelectedLobby] = useState<SelectedLobby | null>(null);
  const [selectedPost, setSelectedPost] = useState<SelectedPost | null>(null);

  const { data: localLobbies, isLoading: lobbiesLoading } = trpc.lobbies.localWithCoords.useQuery();
  const { data: feedPosts, isLoading: postsLoading } = trpc.citizenFeed.forMap.useQuery();

  const isLoading = activeTab === "lobbies" ? lobbiesLoading : postsLoading;

  // On web, react-native-maps is not available, so we show a fallback
  if (Platform.OS === "web") {
    return (
      <ScreenContainer>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>Explorar</Text>
          <Text style={styles.headerSubtitle}>Mapa interativo de lobbys e denúncias</Text>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => setActiveTab("lobbies")}
            style={[
              styles.tabBtn,
              activeTab === "lobbies" && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <IconSymbol name="mappin" size={16} color={activeTab === "lobbies" ? colors.primary : colors.muted} />
            <Text style={[styles.tabBtnText, { color: activeTab === "lobbies" ? colors.primary : colors.muted }]}>
              Lobbys
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("reports")}
            style={[
              styles.tabBtn,
              activeTab === "reports" && { borderBottomColor: colors.error, borderBottomWidth: 2 },
            ]}
          >
            <IconSymbol name="camera.fill" size={16} color={activeTab === "reports" ? colors.error : colors.muted} />
            <Text style={[styles.tabBtnText, { color: activeTab === "reports" ? colors.error : colors.muted }]}>
              Denúncias
            </Text>
          </Pressable>
        </View>

        <ScrollView style={[styles.webFallback, { backgroundColor: colors.background }]}>
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="map.fill" size={60} color={colors.primary} />
            <Text style={[styles.mapPlaceholderTitle, { color: colors.foreground }]}>
              Mapa Interativo
            </Text>
            <Text style={[styles.mapPlaceholderText, { color: colors.muted }]}>
              O mapa interativo está disponível no aplicativo móvel (iOS/Android).
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : activeTab === "lobbies" ? (
            <View style={styles.localList}>
              <Text style={[styles.localListTitle, { color: colors.foreground }]}>
                Lobbys Locais Ativos ({localLobbies?.length ?? 0})
              </Text>
              {localLobbies?.map(lobby => (
                <Pressable
                  key={lobby.id}
                  onPress={() => router.push(`/lobby/${lobby.id}`)}
                  style={({ pressed }) => [
                    styles.localItem,
                    { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <View style={[styles.locationPin, { backgroundColor: colors.secondary }]}>
                    <IconSymbol name="mappin" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.localItemContent}>
                    <Text style={[styles.localItemTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {lobby.title}
                    </Text>
                    <Text style={[styles.localItemLocation, { color: colors.muted }]}>
                      {lobby.locationCity}{lobby.locationState ? `, ${lobby.locationState}` : ""}
                    </Text>
                  </View>
                  <View style={styles.localItemStats}>
                    <IconSymbol name="hand.thumbsup.fill" size={14} color={colors.secondary} />
                    <Text style={[styles.localItemCount, { color: colors.secondary }]}>
                      {lobby.supportCount}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.localList}>
              <Text style={[styles.localListTitle, { color: colors.foreground }]}>
                Denúncias com Localização ({feedPosts?.length ?? 0})
              </Text>
              {feedPosts?.map(post => (
                <Pressable
                  key={post.id}
                  onPress={() => router.push(`/feed/${post.id}` as any)}
                  style={({ pressed }) => [
                    styles.localItem,
                    { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <View style={[styles.locationPin, { backgroundColor: CATEGORY_COLORS[post.category] ?? colors.accent }]}>
                    <Text style={{ fontSize: 14 }}>{CATEGORY_EMOJIS[post.category] ?? "📌"}</Text>
                  </View>
                  <View style={styles.localItemContent}>
                    <Text style={[styles.localItemTitle, { color: colors.foreground }]} numberOfLines={2}>
                      {post.content}
                    </Text>
                    <Text style={[styles.localItemLocation, { color: colors.muted }]}>
                      {post.locationCity}{post.locationState ? `, ${post.locationState}` : ""}
                    </Text>
                  </View>
                  <View style={styles.localItemStats}>
                    <IconSymbol name="heart.fill" size={14} color={colors.error} />
                    <Text style={[styles.localItemCount, { color: colors.error }]}>
                      {post.likesCount}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Native map view — lazy require to avoid Metro web bundling error
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rnMaps = require("react-native-maps");
  const MapView = rnMaps.default;
  const Marker = rnMaps.Marker;

  return (
    <View style={styles.container}>
      {/* Header overlay */}
      <View style={[styles.mapHeader, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Explorar</Text>
        <Text style={styles.headerSubtitle}>
          {activeTab === "lobbies"
            ? `${localLobbies?.length ?? 0} lobbys locais`
            : `${feedPosts?.length ?? 0} denúncias no mapa`}
        </Text>

        {/* Tab Switcher */}
        <View style={styles.mapTabRow}>
          <Pressable
            onPress={() => { setActiveTab("lobbies"); setSelectedPost(null); setSelectedLobby(null); }}
            style={[
              styles.mapTabBtn,
              activeTab === "lobbies"
                ? { backgroundColor: "rgba(255,255,255,0.25)" }
                : { backgroundColor: "rgba(255,255,255,0.08)" },
            ]}
          >
            <IconSymbol name="mappin" size={14} color="#FFFFFF" />
            <Text style={styles.mapTabBtnText}>Lobbys</Text>
          </Pressable>
          <Pressable
            onPress={() => { setActiveTab("reports"); setSelectedPost(null); setSelectedLobby(null); }}
            style={[
              styles.mapTabBtn,
              activeTab === "reports"
                ? { backgroundColor: "rgba(255,255,255,0.25)" }
                : { backgroundColor: "rgba(255,255,255,0.08)" },
            ]}
          >
            <IconSymbol name="camera.fill" size={14} color="#FFFFFF" />
            <Text style={styles.mapTabBtnText}>Denúncias</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Carregando mapa...</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={BRAZIL_CENTER}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {/* Lobby markers */}
          {activeTab === "lobbies" && localLobbies?.map(lobby => {
            if (!lobby.latitude || !lobby.longitude) return null;
            return (
              <Marker
                key={`lobby-${lobby.id}`}
                coordinate={{
                  latitude: parseFloat(String(lobby.latitude)),
                  longitude: parseFloat(String(lobby.longitude)),
                }}
                onPress={() => {
                  setSelectedPost(null);
                  setSelectedLobby({
                    id: lobby.id,
                    title: lobby.title,
                    supportCount: lobby.supportCount,
                    locationCity: lobby.locationCity,
                    locationState: lobby.locationState,
                    category: lobby.category,
                  });
                }}
                pinColor={colors.secondary}
              />
            );
          })}

          {/* Feed post markers */}
          {activeTab === "reports" && feedPosts?.map(post => {
            if (!post.latitude || !post.longitude) return null;
            const markerColor = CATEGORY_COLORS[post.category] ?? "#607D8B";
            return (
              <Marker
                key={`post-${post.id}`}
                coordinate={{
                  latitude: parseFloat(String(post.latitude)),
                  longitude: parseFloat(String(post.longitude)),
                }}
                onPress={() => {
                  setSelectedLobby(null);
                  setSelectedPost({
                    id: post.id,
                    content: post.content,
                    category: post.category,
                    authorName: post.authorName,
                    authorAvatar: post.authorAvatar,
                    locationCity: post.locationCity,
                    locationState: post.locationState,
                    likesCount: post.likesCount,
                    commentsCount: post.commentsCount,
                    mediaUrls: post.mediaUrls,
                  });
                }}
                pinColor={markerColor}
              />
            );
          })}
        </MapView>
      )}

      {/* Selected Lobby Bottom Sheet */}
      {selectedLobby && (
        <View style={[styles.bottomSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.bottomSheetHandle} />
          <View style={styles.bottomSheetContent}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.secondary + "20" }]}>
              <IconSymbol name="mappin" size={12} color={colors.secondary} />
              <Text style={[styles.categoryBadgeText, { color: colors.secondary }]}>Lobby Local</Text>
            </View>
            <Text style={[styles.bottomSheetTitle, { color: colors.foreground }]} numberOfLines={2}>
              {selectedLobby.title}
            </Text>
            {selectedLobby.locationCity && (
              <Text style={[styles.bottomSheetLocation, { color: colors.muted }]}>
                {selectedLobby.locationCity}{selectedLobby.locationState ? `, ${selectedLobby.locationState}` : ""}
              </Text>
            )}
            <View style={styles.bottomSheetFooter}>
              <View style={styles.statRow}>
                <IconSymbol name="hand.thumbsup.fill" size={16} color={colors.secondary} />
                <Text style={[styles.statCount, { color: colors.secondary }]}>
                  {selectedLobby.supportCount} apoios
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setSelectedLobby(null);
                  router.push(`/lobby/${selectedLobby.id}`);
                }}
                style={[styles.viewButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.viewButtonText}>Ver Lobby</Text>
              </Pressable>
            </View>
          </View>
          <Pressable
            onPress={() => setSelectedLobby(null)}
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
          >
            <IconSymbol name="xmark" size={16} color={colors.muted} />
          </Pressable>
        </View>
      )}

      {/* Selected Post Bottom Sheet */}
      {selectedPost && (
        <View style={[styles.bottomSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.bottomSheetHandle} />
          <View style={styles.bottomSheetContent}>
            {/* Category badge */}
            <View style={[styles.categoryBadge, { backgroundColor: (CATEGORY_COLORS[selectedPost.category] ?? "#607D8B") + "20" }]}>
              <Text style={{ fontSize: 12 }}>{CATEGORY_EMOJIS[selectedPost.category] ?? "📌"}</Text>
              <Text style={[styles.categoryBadgeText, { color: CATEGORY_COLORS[selectedPost.category] ?? "#607D8B" }]}>
                {CATEGORY_LABELS[selectedPost.category] ?? "Outros"}
              </Text>
            </View>

            {/* Author */}
            <View style={styles.authorRow}>
              {selectedPost.authorAvatar ? (
                <Image source={{ uri: selectedPost.authorAvatar }} style={styles.authorAvatar} />
              ) : (
                <View style={[styles.authorAvatarPlaceholder, { backgroundColor: colors.primary + "30" }]}>
                  <Text style={{ fontSize: 12, color: colors.primary }}>
                    {selectedPost.authorName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={[styles.authorName, { color: colors.muted }]}>{selectedPost.authorName}</Text>
            </View>

            {/* Content */}
            <Text style={[styles.bottomSheetTitle, { color: colors.foreground }]} numberOfLines={3}>
              {selectedPost.content}
            </Text>

            {/* Location */}
            {selectedPost.locationCity && (
              <Text style={[styles.bottomSheetLocation, { color: colors.muted }]}>
                📍 {selectedPost.locationCity}{selectedPost.locationState ? `, ${selectedPost.locationState}` : ""}
              </Text>
            )}

            {/* Thumbnail */}
            {selectedPost.mediaUrls.length > 0 && (
              <Image
                source={{ uri: selectedPost.mediaUrls[0] }}
                style={styles.postThumbnail}
                resizeMode="cover"
              />
            )}

            <View style={styles.bottomSheetFooter}>
              <View style={styles.statsRow}>
                <View style={styles.statRow}>
                  <IconSymbol name="heart.fill" size={14} color={colors.error} />
                  <Text style={[styles.statCount, { color: colors.error }]}>{selectedPost.likesCount}</Text>
                </View>
                <View style={styles.statRow}>
                  <IconSymbol name="bubble.left.fill" size={14} color={colors.muted} />
                  <Text style={[styles.statCount, { color: colors.muted }]}>{selectedPost.commentsCount}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  setSelectedPost(null);
                  router.push(`/feed/${selectedPost.id}` as any);
                }}
                style={[styles.viewButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.viewButtonText}>Ver Post</Text>
              </Pressable>
            </View>
          </View>
          <Pressable
            onPress={() => setSelectedPost(null)}
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
          >
            <IconSymbol name="xmark" size={16} color={colors.muted} />
          </Pressable>
        </View>
      )}

      {/* Legend for reports tab */}
      {activeTab === "reports" && !selectedPost && feedPosts && feedPosts.length > 0 && (
        <View style={[styles.legend, { backgroundColor: colors.surface + "EE", borderColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.entries(CATEGORY_COLORS).map(([cat, color]) => {
              const count = feedPosts.filter(p => p.category === cat).length;
              if (count === 0) return null;
              return (
                <View key={cat} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={[styles.legendText, { color: colors.muted }]}>
                    {CATEGORY_EMOJIS[cat]} {count}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapHeader: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
    marginBottom: 10,
  },
  mapTabRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  mapTabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  mapTabBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#D0D0D0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  bottomSheetContent: {
    gap: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  authorAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  authorName: {
    fontSize: 13,
    fontWeight: "500",
  },
  bottomSheetTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  bottomSheetLocation: {
    fontSize: 13,
  },
  postThumbnail: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginTop: 4,
  },
  bottomSheetFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statCount: {
    fontSize: 14,
    fontWeight: "700",
  },
  viewButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  viewButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  legend: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  // Web fallback styles
  webFallback: {
    flex: 1,
    padding: 16,
  },
  mapPlaceholder: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  mapPlaceholderText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  localList: {
    gap: 8,
    paddingBottom: 32,
  },
  localListTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  localItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  locationPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  localItemContent: {
    flex: 1,
  },
  localItemTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  localItemLocation: {
    fontSize: 13,
    marginTop: 2,
  },
  localItemStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  localItemCount: {
    fontSize: 14,
    fontWeight: "700",
  },
});
