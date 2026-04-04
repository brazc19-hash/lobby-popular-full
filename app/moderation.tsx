import React, { useState } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput,
  Alert, ActivityIndicator, StyleSheet, FlatList,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const FLAG_LABELS: Record<string, string> = {
  hate_speech: "🚫 Discurso de Ódio",
  criminal_content: "⚠️ Conteúdo Criminoso",
  fake_news: "📰 Fake News",
  no_legal_basis: "⚖️ Sem Base Legal",
  spam: "📧 Spam",
};

const REASON_LABELS: Record<string, string> = {
  hate_speech: "Discurso de ódio",
  criminal_content: "Conteúdo criminoso",
  fake_news: "Fake news / desinformação",
  spam: "Spam",
  harassment: "Assédio",
  other: "Outro",
};

type StatusFilter = "pending" | "approved" | "rejected" | "escalated";

export default function ModerationScreen() {
  const goBack = useSmartBack("/(tabs)");
  const colors = useColors();
  const utils = trpc.useUtils();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [reviewNote, setReviewNote] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: canModData, isLoading: checkingAccess } = trpc.moderation.canModerate.useQuery();
  const { data: stats } = trpc.moderation.stats.useQuery(undefined, {
    enabled: canModData?.canModerate === true,
    refetchInterval: 30000,
  });
  const { data: queue, isLoading: loadingQueue } = trpc.moderation.queue.useQuery(
    { status: statusFilter, limit: 20, offset: 0 },
    { enabled: canModData?.canModerate === true }
  );

  const reviewMutation = trpc.moderation.review.useMutation({
    onSuccess: () => {
      utils.moderation.queue.invalidate();
      utils.moderation.stats.invalidate();
      setSelectedId(null);
      setReviewNote("");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });

  const handleReview = (queueId: number, action: "approve" | "reject" | "escalate") => {
    if (action === "reject" && !reviewNote.trim()) {
      Alert.alert("Nota obrigatória", "Por favor, informe o motivo da rejeição.");
      return;
    }
    Alert.alert(
      action === "approve" ? "Aprovar conteúdo?" : action === "reject" ? "Rejeitar conteúdo?" : "Escalar para admin?",
      action === "approve"
        ? "O conteúdo será publicado e ficará visível para todos."
        : action === "reject"
        ? "O conteúdo será removido e o autor notificado."
        : "O item será escalado para revisão de um administrador.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: action === "approve" ? "Aprovar" : action === "reject" ? "Rejeitar" : "Escalar",
          style: action === "reject" ? "destructive" : "default",
          onPress: () => reviewMutation.mutate({ queueId, action, note: reviewNote || undefined }),
        },
      ]
    );
  };

  if (checkingAccess) {
    return (
      <ScreenContainer>
        <View style={[s.center, { flex: 1 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!canModData?.canModerate) {
    return (
      <ScreenContainer>
        <View style={[s.header, { backgroundColor: "#1E3A5F" }]}>
          <BackButton onPress={goBack} label="Voltar" variant="dark" />
          <Text style={s.headerTitle}>🛡️ Moderação</Text>
        </View>
        <View style={[s.center, { flex: 1, padding: 32 }]}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
          <Text style={[s.title, { color: colors.foreground, textAlign: "center" }]}>
            Acesso Restrito
          </Text>
          <Text style={[s.sub, { color: colors.muted, textAlign: "center", marginTop: 8 }]}>
            O Painel de Moderação é acessível apenas para administradores, moderadores e membros do
            Comitê de Transparência (Nível 4 — Líder Comunitário ou superior).
          </Text>
          <View style={[s.infoBox, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 24 }]}>
            <Text style={[s.infoTitle, { color: colors.foreground }]}>Seu nível atual</Text>
            <Text style={[s.infoValue, { color: colors.primary }]}>
              Nível {canModData?.level ?? 1} — {canModData?.role === "admin" ? "Admin" : canModData?.role === "moderator" ? "Moderador" : "Cidadão"}
            </Text>
            <Text style={[s.infoSub, { color: colors.muted }]}>
              Alcance o Nível 4 (Líder Comunitário) para participar do Comitê de Transparência.
            </Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: "#1E3A5F" }]}>
        <BackButton onPress={goBack} label="Voltar" variant="dark" />
        <Text style={s.headerTitle}>🛡️ Painel de Moderação</Text>
        <Text style={s.headerSub}>Comitê de Transparência Popular</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats */}
        {stats && (
          <View style={[s.statsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            {[
              { label: "Pendentes", value: stats.pending, color: "#F59E0B" },
              { label: "Aprovados", value: stats.approved, color: "#22C55E" },
              { label: "Rejeitados", value: stats.rejected, color: "#EF4444" },
              { label: "Escalados", value: stats.escalated, color: "#8B5CF6" },
            ].map((s2) => (
              <View key={s2.label} style={s.statItem}>
                <Text style={[s.statNum, { color: s2.color }]}>{s2.value}</Text>
                <Text style={[s.statLabel, { color: colors.muted }]}>{s2.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {(["pending", "approved", "rejected", "escalated"] as StatusFilter[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setStatusFilter(f)}
              style={[s.filterChip, {
                backgroundColor: statusFilter === f ? "#1E3A5F" : colors.surface,
                borderColor: statusFilter === f ? "#1E3A5F" : colors.border,
              }]}
            >
              <Text style={[s.filterChipText, { color: statusFilter === f ? "#fff" : colors.muted }]}>
                {f === "pending" ? "⏳ Pendentes" : f === "approved" ? "✅ Aprovados" : f === "rejected" ? "❌ Rejeitados" : "🔺 Escalados"}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Queue */}
        {loadingQueue ? (
          <View style={[s.center, { paddingVertical: 40 }]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : !queue || queue.length === 0 ? (
          <View style={[s.center, { paddingVertical: 48 }]}>
            <Text style={{ fontSize: 40 }}>✅</Text>
            <Text style={[s.emptyText, { color: colors.muted }]}>Nenhum item {statusFilter === "pending" ? "pendente" : "encontrado"}</Text>
          </View>
        ) : (
          <View style={{ padding: 16, gap: 12 }}>
            {queue.map((item) => (
              <View key={item.id} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Card header */}
                <View style={s.cardHeader}>
                  <View style={[s.typeBadge, { backgroundColor: item.contentType === "lobby" ? "#1E3A5F20" : "#22C55E20" }]}>
                    <Text style={[s.typeBadgeText, { color: item.contentType === "lobby" ? "#1E3A5F" : "#22C55E" }]}>
                      {item.contentType === "lobby" ? "📋 Lobby" : item.contentType === "post" ? "💬 Post" : "💭 Comentário"}
                    </Text>
                  </View>
                  <Text style={[s.cardDate, { color: colors.muted }]}>
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </Text>
                </View>

                {/* Title */}
                <Text style={[s.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {item.contentTitle ?? "Sem título"}
                </Text>
                <Text style={[s.cardText, { color: colors.muted }]} numberOfLines={3}>
                  {item.contentText ?? ""}
                </Text>

                {/* AI Analysis */}
                {item.aiScore !== null && (
                  <View style={[s.aiBox, { backgroundColor: Number(item.aiScore) >= 70 ? "#EF444420" : Number(item.aiScore) >= 40 ? "#F59E0B20" : "#22C55E20" }]}>
                    <Text style={[s.aiTitle, { color: Number(item.aiScore) >= 70 ? "#EF4444" : Number(item.aiScore) >= 40 ? "#F59E0B" : "#22C55E" }]}>
                      🤖 Análise IA — Risco: {Number(item.aiScore).toFixed(0)}/100
                    </Text>
                    {item.aiFlags && item.aiFlags.length > 0 && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                        {item.aiFlags.map((flag: string) => (
                          <Text key={flag} style={[s.flagBadge, { backgroundColor: "#EF444430", color: "#EF4444" }]}>
                            {FLAG_LABELS[flag] ?? flag}
                          </Text>
                        ))}
                      </View>
                    )}
                    {item.aiReason && (
                      <Text style={[s.aiReason, { color: colors.muted }]}>{item.aiReason}</Text>
                    )}
                  </View>
                )}

                {/* Author */}
                <Text style={[s.author, { color: colors.muted }]}>
                  👤 {item.userName}
                </Text>

                {/* Actions — only for pending */}
                {item.status === "pending" && (
                  <View style={{ marginTop: 12 }}>
                    {selectedId === item.id && (
                      <TextInput
                        style={[s.noteInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                        placeholder="Nota para o autor (obrigatório ao rejeitar)..."
                        placeholderTextColor={colors.muted}
                        value={reviewNote}
                        onChangeText={setReviewNote}
                        multiline
                        numberOfLines={2}
                      />
                    )}
                    <View style={s.actionRow}>
                      <Pressable
                        onPress={() => { setSelectedId(item.id); handleReview(item.id, "approve"); }}
                        style={({ pressed }) => [s.actionBtn, { backgroundColor: "#22C55E", opacity: pressed ? 0.8 : 1 }]}
                      >
                        <Text style={s.actionBtnText}>✅ Aprovar</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setSelectedId(item.id === selectedId ? null : item.id)}
                        style={({ pressed }) => [s.actionBtn, { backgroundColor: "#EF4444", opacity: pressed ? 0.8 : 1 }]}
                      >
                        <Text style={s.actionBtnText}>❌ Rejeitar</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => { setSelectedId(item.id); handleReview(item.id, "escalate"); }}
                        style={({ pressed }) => [s.actionBtn, { backgroundColor: "#8B5CF6", opacity: pressed ? 0.8 : 1 }]}
                      >
                        <Text style={s.actionBtnText}>🔺 Escalar</Text>
                      </Pressable>
                    </View>
                    {selectedId === item.id && (
                      <Pressable
                        onPress={() => handleReview(item.id, "reject")}
                        style={({ pressed }) => [s.confirmRejectBtn, { opacity: pressed ? 0.8 : 1 }]}
                      >
                        <Text style={s.confirmRejectText}>Confirmar Rejeição</Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {/* Reviewed info */}
                {item.status !== "pending" && item.reviewerName && (
                  <Text style={[s.reviewedBy, { color: colors.muted }]}>
                    Revisado por {item.reviewerName}
                    {item.reviewNote ? ` — "${item.reviewNote}"` : ""}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { padding: 20, paddingTop: 12, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 8 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  center: { alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", paddingVertical: 16, borderBottomWidth: 1 },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  filterRow: { paddingVertical: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 13, fontWeight: "600" },
  card: { borderRadius: 12, padding: 16, borderWidth: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 12, fontWeight: "700" },
  cardDate: { fontSize: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  cardText: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  aiBox: { borderRadius: 8, padding: 10, marginBottom: 8 },
  aiTitle: { fontSize: 13, fontWeight: "700" },
  flagBadge: { fontSize: 11, fontWeight: "600", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  aiReason: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  author: { fontSize: 12, marginTop: 4 },
  noteInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 13, marginBottom: 8, minHeight: 60 },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  confirmRejectBtn: { backgroundColor: "#EF4444", borderRadius: 8, padding: 12, alignItems: "center", marginTop: 8 },
  confirmRejectText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  reviewedBy: { fontSize: 12, marginTop: 8, fontStyle: "italic" },
  title: { fontSize: 20, fontWeight: "800" },
  sub: { fontSize: 14, lineHeight: 20 },
  infoBox: { width: "100%", borderRadius: 12, padding: 16, borderWidth: 1 },
  infoTitle: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  infoValue: { fontSize: 18, fontWeight: "800" },
  infoSub: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  emptyText: { fontSize: 15, marginTop: 12 },
});
