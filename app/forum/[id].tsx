import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ForumPostScreen() {
  const goBack = useSmartBack("/(tabs)");
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = parseInt(id ?? "0");
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [commentText, setCommentText] = useState("");

  const { data: post, isLoading: postLoading } = trpc.forum.postById.useQuery({ id: postId });
  const { data: comments, isLoading: commentsLoading, refetch: refetchComments } = trpc.forum.comments.useQuery({ postId });

  const createCommentMutation = trpc.forum.createComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      refetchComments();
      utils.forum.postById.invalidate({ id: postId });
    },
  });

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    createCommentMutation.mutate({ postId, content: commentText.trim() });
  };

  if (postLoading) {
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
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: colors.muted }]}>Post não encontrado</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <BackButton
          onPress={goBack}
          variant="dark"
          label="Voltar"
        />
        <Text style={styles.headerTitle} numberOfLines={1}>Discussão</Text>
      </View>

      <FlatList
        data={comments}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 16 }}>
            {/* Post Card */}
            <View style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.postTitle, { color: colors.foreground }]}>{post.title}</Text>
              <Text style={[styles.postContent, { color: colors.muted }]}>{post.content}</Text>
              <View style={styles.postMeta}>
                <IconSymbol name="clock" size={13} color={colors.muted} />
                <Text style={[styles.postMetaText, { color: colors.muted }]}>
                  {formatDate(post.createdAt)}
                </Text>
                <View style={styles.dot} />
                <IconSymbol name="bubble.left" size={13} color={colors.muted} />
                <Text style={[styles.postMetaText, { color: colors.muted }]}>
                  {post.commentCount} comentários
                </Text>
              </View>
            </View>

            {/* Comments Header */}
            <Text style={[styles.commentsTitle, { color: colors.foreground }]}>
              Comentários ({comments?.length ?? 0})
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.commentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.commentAvatar, { backgroundColor: colors.primary + "20" }]}>
              <IconSymbol name="person.fill" size={16} color={colors.primary} />
            </View>
            <View style={styles.commentContent}>
              <Text style={[styles.commentText, { color: colors.foreground }]}>{item.content}</Text>
              <Text style={[styles.commentDate, { color: colors.muted }]}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          commentsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <IconSymbol name="bubble.left" size={32} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                Nenhum comentário ainda. Seja o primeiro!
              </Text>
            </View>
          )
        }
        ListFooterComponent={<View style={{ height: 80 }} />}
      />

      {/* Comment Input */}
      {isAuthenticated ? (
        <View style={[styles.commentBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.commentInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
            placeholder="Escreva um comentário..."
            placeholderTextColor={colors.muted}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            returnKeyType="done"
          />
          <Pressable
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || createCommentMutation.isPending}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: commentText.trim() ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {createCommentMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconSymbol name="paperplane.fill" size={18} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      ) : (
        <View style={[styles.loginBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.loginBarText, { color: colors.muted }]}>
            Faça login para comentar
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={[styles.loginBarBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.loginBarBtnText}>Entrar</Text>
          </Pressable>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
  },
  postCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  postMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  postMetaText: {
    fontSize: 13,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#999",
  },
  commentsTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  commentCard: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  commentContent: {
    flex: 1,
    gap: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentDate: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  commentBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  loginBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  loginBarText: {
    fontSize: 14,
  },
  loginBarBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  loginBarBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
