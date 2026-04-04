import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  infrastructure: { label: "Infraestrutura", emoji: "🏗️", color: "#E67E22" },
  education: { label: "Educação", emoji: "📚", color: "#2980B9" },
  health: { label: "Saúde", emoji: "🏥", color: "#27AE60" },
  security: { label: "Segurança", emoji: "🛡️", color: "#8E44AD" },
  environment: { label: "Meio Ambiente", emoji: "🌿", color: "#16A085" },
  human_rights: { label: "Direitos Humanos", emoji: "✊", color: "#C0392B" },
  economy: { label: "Economia", emoji: "💰", color: "#F39C12" },
  transparency: { label: "Transparência", emoji: "👁️", color: "#2C3E50" },
  culture: { label: "Cultura", emoji: "🎭", color: "#D35400" },
  other: { label: "Outros", emoji: "📌", color: "#7F8C8D" },
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

export default function FeedPostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = parseInt(id ?? "0", 10);
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(0);
  const utils = trpc.useUtils();

  const { data: post, isLoading } = trpc.citizenFeed.getById.useQuery(
    { postId },
    { enabled: !!postId }
  );

  const { data: comments, isLoading: commentsLoading } = trpc.citizenFeed.comments.useQuery(
    { postId },
    { enabled: !!postId }
  );

  const likeMutation = trpc.citizenFeed.like.useMutation({
    onSuccess: () => {
      utils.citizenFeed.getById.invalidate({ postId });
    },
  });

  const commentMutation = trpc.citizenFeed.comment.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.citizenFeed.comments.invalidate({ postId });
      utils.citizenFeed.getById.invalidate({ postId });
    },
  });

  const deleteMutation = trpc.citizenFeed.delete.useMutation({
    onSuccess: () => {
      router.back();
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      Alert.alert("Login necessário", "Faça login para curtir posts.");
      return;
    }
    likeMutation.mutate({ postId });
  };

  const handleComment = () => {
    if (!isAuthenticated) {
      Alert.alert("Login necessário", "Faça login para comentar.");
      return;
    }
    if (!commentText.trim()) return;
    commentMutation.mutate({ postId, content: commentText.trim() });
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: `🚨 Denúncia no Populus\n\n${post.content}\n\n📍 ${post.locationCity ?? ""}${post.locationState ? `, ${post.locationState}` : ""}\n\nBaixe o Populus e participe da democracia cidadã!`,
        title: "Denúncia Cidadã — Populus",
      });
    } catch {
      // user cancelled
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Excluir post",
      "Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => deleteMutation.mutate({ postId }),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!post) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <BackButton />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Post não encontrado</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ fontSize: 40 }}>😕</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Este post não existe ou foi removido.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const cat = CATEGORY_LABELS[post.category] ?? CATEGORY_LABELS.other;
  const isOwner = user?.id === post.userId;
  const mediaUrls = post.mediaUrls ?? [];
  const mediaTypes = post.mediaTypes ?? [];

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <BackButton />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Denúncia</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={{ fontSize: 20 }}>📤</Text>
            </Pressable>
            {isOwner && (
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={{ fontSize: 20 }}>🗑️</Text>
              </Pressable>
            )}
          </View>
        </View>

        <FlatList
          data={comments ?? []}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={() => (
            <View>
              {/* Media Gallery */}
              {mediaUrls.length > 0 && (
                <View style={styles.mediaSection}>
                  <View style={[styles.mediaPlaceholder, { backgroundColor: colors.surface }]}>
                    <Text style={{ fontSize: 48 }}>
                      {mediaTypes[selectedMedia] === "video" ? "🎬" : "🖼️"}
                    </Text>
                    <Text style={[styles.mediaLabel, { color: colors.muted }]}>
                      {mediaTypes[selectedMedia] === "video" ? "Vídeo" : "Imagem"} {selectedMedia + 1}/{mediaUrls.length}
                    </Text>
                    <Text style={[styles.mediaUrl, { color: colors.muted }]} numberOfLines={1}>
                      {mediaUrls[selectedMedia]}
                    </Text>
                  </View>
                  {mediaUrls.length > 1 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailRow}>
                      {mediaUrls.map((_, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => setSelectedMedia(idx)}
                          style={[
                            styles.thumbnail,
                            {
                              backgroundColor: idx === selectedMedia ? colors.primary : colors.surface,
                              borderColor: idx === selectedMedia ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 16 }}>
                            {mediaTypes[idx] === "video" ? "🎬" : "🖼️"}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}

              {/* Post Content */}
              <View style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Author */}
                <View style={styles.authorRow}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {post.authorName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.authorName, { color: colors.foreground }]}>{post.authorName}</Text>
                    <Text style={[styles.postTime, { color: colors.muted }]}>
                      {formatRelativeTime(post.createdAt)}
                    </Text>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: cat.color + "20" }]}>
                    <Text style={{ fontSize: 12 }}>{cat.emoji}</Text>
                    <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
                  </View>
                </View>

                {/* Location */}
                {(post.locationCity || post.locationAddress) && (
                  <View style={styles.locationRow}>
                    <Text style={{ fontSize: 12 }}>📍</Text>
                    <Text style={[styles.locationText, { color: colors.muted }]}>
                      {[post.locationAddress, post.locationCity, post.locationState].filter(Boolean).join(", ")}
                    </Text>
                  </View>
                )}

                {/* Content */}
                <Text style={[styles.postContent, { color: colors.foreground }]}>{post.content}</Text>

                {/* Actions */}
                <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
                  <Pressable
                    onPress={handleLike}
                    style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Text style={{ fontSize: 20 }}>{post.isLiked ? "❤️" : "🤍"}</Text>
                    <Text style={[styles.actionCount, { color: post.isLiked ? "#E74C3C" : colors.muted }]}>
                      {post.likesCount}
                    </Text>
                  </Pressable>
                  <View style={styles.actionBtn}>
                    <Text style={{ fontSize: 20 }}>💬</Text>
                    <Text style={[styles.actionCount, { color: colors.muted }]}>{post.commentsCount}</Text>
                  </View>
                  <Pressable
                    onPress={handleShare}
                    style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Text style={{ fontSize: 20 }}>📤</Text>
                    <Text style={[styles.actionCount, { color: colors.muted }]}>Compartilhar</Text>
                  </Pressable>
                </View>
              </View>

              {/* Comments Header */}
              <View style={[styles.commentsHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.commentsTitle, { color: colors.foreground }]}>
                  Comentários ({comments?.length ?? 0})
                </Text>
              </View>

              {commentsLoading && (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
              )}
            </View>
          )}
          renderItem={({ item }) => (
            <View style={[styles.commentItem, { borderBottomColor: colors.border }]}>
              <View style={[styles.commentAvatar, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.commentAvatarText, { color: colors.primary }]}>
                  {item.authorName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.commentHeader}>
                  <Text style={[styles.commentAuthor, { color: colors.foreground }]}>{item.authorName}</Text>
                  <Text style={[styles.commentTime, { color: colors.muted }]}>
                    {formatRelativeTime(item.createdAt)}
                  </Text>
                </View>
                <Text style={[styles.commentContent, { color: colors.foreground }]}>{item.content}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            !commentsLoading ? (
              <View style={styles.emptyComments}>
                <Text style={{ fontSize: 32 }}>💬</Text>
                <Text style={[styles.emptyText, { color: colors.muted }]}>Seja o primeiro a comentar!</Text>
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />

        {/* Comment Input */}
        <View style={[styles.commentInputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {isAuthenticated ? (
            <>
              <TextInput
                style={[styles.commentInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                placeholder="Adicionar comentário..."
                placeholderTextColor={colors.muted}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
                returnKeyType="done"
              />
              <Pressable
                onPress={handleComment}
                disabled={!commentText.trim() || commentMutation.isPending}
                style={({ pressed }) => [
                  styles.sendBtn,
                  { backgroundColor: commentText.trim() ? colors.primary : colors.border, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                {commentMutation.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ color: "#fff", fontSize: 16 }}>➤</Text>
                }
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => router.push("/login-govbr")}
              style={[styles.loginToComment, { backgroundColor: colors.primary + "15" }]}
            >
              <Text style={[styles.loginToCommentText, { color: colors.primary }]}>
                Faça login para comentar
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerBtn: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  mediaSection: {
    backgroundColor: "#000",
  },
  mediaPlaceholder: {
    height: 280,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  mediaLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  mediaUrl: {
    fontSize: 10,
    maxWidth: 280,
    paddingHorizontal: 16,
  },
  thumbnailRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  postCard: {
    margin: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 16,
    gap: 12,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
  },
  postTime: {
    fontSize: 12,
    marginTop: 1,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    flex: 1,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 0.5,
    gap: 20,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionCount: {
    fontSize: 13,
    fontWeight: "500",
  },
  commentsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  commentsTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  commentItem: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatarText: {
    fontSize: 13,
    fontWeight: "700",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "600",
  },
  commentTime: {
    fontSize: 11,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyComments: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  commentInputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  loginToComment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  loginToCommentText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
