import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const CATEGORIES = [
  { id: "", label: "Todos", emoji: "🌐" },
  { id: "infrastructure", label: "Infraestrutura", emoji: "🏗️" },
  { id: "health", label: "Saúde", emoji: "🏥" },
  { id: "education", label: "Educação", emoji: "📚" },
  { id: "security", label: "Segurança", emoji: "🚔" },
  { id: "environment", label: "Meio Ambiente", emoji: "🌿" },
  { id: "transparency", label: "Transparência", emoji: "🔍" },
  { id: "other", label: "Outros", emoji: "📌" },
];

const CATEGORY_COLORS: Record<string, string> = {
  infrastructure: "#E67E22",
  health: "#E74C3C",
  education: "#3498DB",
  security: "#2C3E50",
  environment: "#27AE60",
  human_rights: "#8E44AD",
  economy: "#F39C12",
  transparency: "#1ABC9C",
  culture: "#E91E63",
  other: "#7F8C8D",
};

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

interface PostCardProps {
  post: {
    id: number;
    userId: number;
    authorName: string;
    authorAvatar?: string;
    content: string;
    mediaUrls: string[];
    mediaTypes: Array<"image" | "video">;
    category: string;
    locationCity?: string;
    locationState?: string;
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    isLiked: boolean;
    createdAt: Date;
  };
  currentUserId?: number;
  onLike: (postId: number) => void;
  onComment: (postId: number) => void;
  onDelete?: (postId: number) => void;
}

function PostCard({ post, currentUserId, onLike, onComment, onDelete }: PostCardProps) {
  const colors = useColors();
  const catColor = CATEGORY_COLORS[post.category] ?? "#7F8C8D";
  const catInfo = CATEGORIES.find((c) => c.id === post.category);
  const isOwner = currentUserId === post.userId;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Pressable
          onPress={() => router.push(`/profile/${post.userId}` as any)}
          style={({ pressed }) => [styles.avatar, { backgroundColor: catColor + "30", opacity: pressed ? 0.8 : 1 }]}
        >
          {post.authorAvatar ? (
            <Image source={{ uri: post.authorAvatar }} style={styles.avatarImg} />
          ) : (
            <Text style={[styles.avatarInitial, { color: catColor }]}>
              {post.authorName.charAt(0).toUpperCase()}
            </Text>
          )}
        </Pressable>
        <View style={styles.cardHeaderInfo}>
          <Pressable onPress={() => router.push(`/profile/${post.userId}` as any)}>
            <Text style={[styles.authorName, { color: colors.foreground }]} numberOfLines={1}>
              {post.authorName}
            </Text>
          </Pressable>
          <View style={styles.metaRow}>
            {post.locationCity && (
              <Text style={[styles.metaText, { color: colors.muted }]}>
                📍 {post.locationCity}{post.locationState ? `/${post.locationState}` : ""}
              </Text>
            )}
            <Text style={[styles.metaText, { color: colors.muted }]}>
              · {timeAgo(post.createdAt)}
            </Text>
          </View>
        </View>
        <View style={[styles.catBadge, { backgroundColor: catColor + "20" }]}>
          <Text style={styles.catEmoji}>{catInfo?.emoji ?? "📌"}</Text>
          <Text style={[styles.catLabel, { color: catColor }]} numberOfLines={1}>
            {catInfo?.label ?? post.category}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Text style={[styles.content, { color: colors.foreground }]}>{post.content}</Text>

      {/* Media */}
      {post.mediaUrls.length > 0 && (
        <View style={styles.mediaGrid}>
          {post.mediaUrls.slice(0, 3).map((url, idx) => (
            <View key={idx} style={[
              styles.mediaItem,
              post.mediaUrls.length === 1 && styles.mediaItemFull,
              post.mediaUrls.length === 2 && styles.mediaItemHalf,
              post.mediaUrls.length >= 3 && styles.mediaItemThird,
            ]}>
              <Image
                source={{ uri: url }}
                style={styles.mediaImg}
                resizeMode="cover"
              />
              {post.mediaTypes[idx] === "video" && (
                <View style={styles.videoOverlay}>
                  <Text style={styles.videoPlay}>▶</Text>
                </View>
              )}
              {idx === 2 && post.mediaUrls.length > 3 && (
                <View style={styles.moreOverlay}>
                  <Text style={styles.moreText}>+{post.mediaUrls.length - 3}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <Pressable
          onPress={() => onLike(post.id)}
          style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.actionIcon, post.isLiked && { color: "#E74C3C" }]}>
            {post.isLiked ? "❤️" : "🤍"}
          </Text>
          <Text style={[styles.actionCount, { color: post.isLiked ? "#E74C3C" : colors.muted }]}>
            {post.likesCount > 0 ? post.likesCount : ""}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onComment(post.id)}
          style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={[styles.actionCount, { color: colors.muted }]}>
            {post.commentsCount > 0 ? post.commentsCount : ""}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={[styles.actionCount, { color: colors.muted }]}>
            {post.sharesCount > 0 ? post.sharesCount : ""}
          </Text>
        </Pressable>

        {isOwner && onDelete && (
          <Pressable
            onPress={() => onDelete(post.id)}
            style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1, marginLeft: "auto" }]}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();
  const goBack = useSmartBack("/(tabs)");
  const [activeCategory, setActiveCategory] = useState("");
  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  const { data: posts, isLoading, refetch, isRefetching } = trpc.citizenFeed.list.useQuery({
    limit: 20,
    offset: 0,
    category: activeCategory || undefined,
  });

  const likeMutation = trpc.citizenFeed.like.useMutation({
    onSuccess: () => refetch(),
  });

  const commentMutation = trpc.citizenFeed.comment.useMutation({
    onSuccess: () => {
      setCommentPostId(null);
      setCommentText("");
      refetch();
    },
  });

  const deleteMutation = trpc.citizenFeed.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleLike = useCallback((postId: number) => {
    if (!isAuthenticated) {
      Alert.alert("Login necessário", "Faça login para curtir posts.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    likeMutation.mutate({ postId });
  }, [isAuthenticated, likeMutation]);

  const handleComment = useCallback((postId: number) => {
    if (!isAuthenticated) {
      Alert.alert("Login necessário", "Faça login para comentar.");
      return;
    }
    setCommentPostId(postId);
  }, [isAuthenticated]);

  const handleSubmitComment = useCallback(() => {
    if (!commentPostId || !commentText.trim()) return;
    commentMutation.mutate({ postId: commentPostId, content: commentText.trim() });
  }, [commentPostId, commentText, commentMutation]);

  const handleDelete = useCallback((postId: number) => {
    Alert.alert("Excluir post", "Tem certeza que deseja excluir este post?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteMutation.mutate({ postId }) },
    ]);
  }, [deleteMutation]);

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1E3A5F" }]}>
        <View style={styles.headerContent}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <BackButton onPress={goBack} label="" variant="dark" />
            <View>
              <Text style={styles.headerTitle}>📢 Feed Cidadão</Text>
              <Text style={styles.headerSub}>Denúncias e registros da comunidade</Text>
            </View>
          </View>
          {isAuthenticated && (
            <Pressable
              onPress={() => router.push("/feed/create" as never)}
              style={({ pressed }) => [styles.newPostBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.newPostBtnText}>+ Postar</Text>
            </Pressable>
          )}
        </View>

        {/* Category Filter */}
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setActiveCategory(item.id)}
              style={({ pressed }) => [
                styles.catChip,
                activeCategory === item.id && styles.catChipActive,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.catChipEmoji}>{item.emoji}</Text>
              <Text style={[
                styles.catChipLabel,
                activeCategory === item.id ? styles.catChipLabelActive : { color: "rgba(255,255,255,0.7)" },
              ]}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Comment Input (quando ativo) */}
      {commentPostId !== null && (
        <View style={[styles.commentBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.commentInput, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="Escreva um comentário..."
            placeholderTextColor={colors.muted}
            value={commentText}
            onChangeText={setCommentText}
            autoFocus
            returnKeyType="send"
            onSubmitEditing={handleSubmitComment}
          />
          <Pressable
            onPress={handleSubmitComment}
            style={({ pressed }) => [styles.commentSend, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.commentSendText}>Enviar</Text>
          </Pressable>
          <Pressable
            onPress={() => { setCommentPostId(null); setCommentText(""); }}
            style={({ pressed }) => [styles.commentCancel, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={[styles.commentCancelText, { color: colors.muted }]}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* Feed List */}
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#1E3A5F" />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Carregando feed...</Text>
        </View>
      ) : !posts || posts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📢</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum post ainda</Text>
          <Text style={[styles.emptyBody, { color: colors.muted }]}>
            Seja o primeiro a registrar uma denúncia ou situação na sua comunidade.
          </Text>
          {isAuthenticated && (
            <Pressable
              onPress={() => router.push("/feed/create" as never)}
              style={({ pressed }) => [styles.emptyBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.emptyBtnText}>📸 Criar primeiro post</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={user?.id}
              onLike={handleLike}
              onComment={handleComment}
              onDelete={isAuthenticated ? handleDelete : undefined}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1E3A5F" />
          }
          ListFooterComponent={<View style={{ height: 80 }} />}
        />
      )}

      {/* FAB para criar post */}
      {isAuthenticated && (
        <Pressable
          onPress={() => router.push("/feed/create" as never)}
          style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.fabText}>📸</Text>
        </Pressable>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 12, paddingBottom: 8 },
  headerContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  newPostBtn: { backgroundColor: "#E8A020", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  newPostBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  catList: { paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)" },
  catChipActive: { backgroundColor: "#FFFFFF" },
  catChipEmoji: { fontSize: 14 },
  catChipLabel: { fontSize: 12, fontWeight: "600" },
  catChipLabelActive: { color: "#1E3A5F" },
  commentBar: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8, borderBottomWidth: 1 },
  commentInput: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14 },
  commentSend: { backgroundColor: "#1E3A5F", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  commentSendText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
  commentCancel: { padding: 8 },
  commentCancelText: { fontSize: 16 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyBody: { fontSize: 14, lineHeight: 22, textAlign: "center" },
  emptyBtn: { backgroundColor: "#1E3A5F", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  list: { padding: 12, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarInitial: { fontSize: 18, fontWeight: "700" },
  cardHeaderInfo: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaText: { fontSize: 11 },
  catBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, maxWidth: 110 },
  catEmoji: { fontSize: 12 },
  catLabel: { fontSize: 10, fontWeight: "700" },
  content: { fontSize: 14, lineHeight: 22, paddingHorizontal: 12, paddingBottom: 10 },
  mediaGrid: { flexDirection: "row", gap: 2, paddingHorizontal: 12, paddingBottom: 10 },
  mediaItem: { borderRadius: 8, overflow: "hidden", position: "relative" },
  mediaItemFull: { flex: 1, height: 220 },
  mediaItemHalf: { flex: 1, height: 160 },
  mediaItemThird: { flex: 1, height: 120 },
  mediaImg: { width: "100%", height: "100%" },
  videoOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.3)" },
  videoPlay: { fontSize: 28, color: "#FFFFFF" },
  moreOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  moreText: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  actions: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 4 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
  actionIcon: { fontSize: 18 },
  actionCount: { fontSize: 13, fontWeight: "600" },
  fab: { position: "absolute", bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: "#E8A020", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabText: { fontSize: 24 },
});
