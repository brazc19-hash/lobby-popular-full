import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet, Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export default function DeputyDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id, name, party, state } = useLocalSearchParams<{ id: string; name: string; party: string; state: string }>();
  const [reportRequested, setReportRequested] = useState(false);

  const votingHistoryQuery = trpc.congress.deputyVotingHistory.useQuery(
    { deputyId: id ?? "" },
    { enabled: !!id }
  );

  const transparencyMutation = trpc.congress.transparencyReport.useMutation();

  const handleRequestReport = () => {
    if (!name || !party || !state) return;
    setReportRequested(true);
    transparencyMutation.mutate({
      deputyName: name,
      deputyParty: party,
      deputyState: state,
    });
  };

  const report = transparencyMutation.data;

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#27AE60";
    if (score >= 40) return "#E67E22";
    return "#C0392B";
  };

  const getVoteIcon = (vote: string) => {
    if (vote === "sim") return "✅";
    if (vote === "nao") return "❌";
    if (vote === "abstencao") return "🟡";
    return "⚫";
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={18} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Congresso</Text>
        </TouchableOpacity>

        {/* Deputy Header */}
        <View style={[styles.deputyHeader, { backgroundColor: "#1B4F72" }]}>
          <View style={styles.deputyAvatar}>
            <Text style={styles.deputyAvatarText}>
              {(name ?? "").split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
            </Text>
          </View>
          <Text style={styles.deputyName}>{name}</Text>
          <View style={styles.deputyBadges}>
            <View style={[styles.badge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Text style={styles.badgeText}>{party}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Text style={styles.badgeText}>{state}</Text>
            </View>
          </View>
          {/* Contact */}
          <TouchableOpacity
            style={styles.emailBtn}
            onPress={() => Linking.openURL(`mailto:dep.${(name ?? "").toLowerCase().replace(/\s+/g, "")}@camara.leg.br`)}
          >
            <IconSymbol name="envelope.fill" size={14} color="#fff" />
            <Text style={styles.emailBtnText}>Enviar e-mail</Text>
          </TouchableOpacity>
        </View>

        {/* Voting History */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📊 Histórico de Votações</Text>
          {votingHistoryQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : votingHistoryQuery.data && votingHistoryQuery.data.length > 0 ? (
            votingHistoryQuery.data.map((vote, idx) => (
              <View key={idx} style={[styles.voteItem, { borderColor: colors.border }]}>
                <Text style={styles.voteIcon}>{getVoteIcon(vote.vote)}</Text>
                <View style={styles.voteInfo}>
                  <Text style={[styles.voteBill, { color: colors.foreground }]} numberOfLines={2}>{vote.billTitle}</Text>
                  <Text style={[styles.voteDate, { color: colors.muted }]}>
                    {vote.date ? new Date(vote.date).toLocaleDateString("pt-BR") : "Data não informada"}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {id?.startsWith("dep-")
                ? "Histórico disponível apenas para deputados com ID real da API da Câmara."
                : "Nenhum histórico de votação disponível."}
            </Text>
          )}
        </View>

        {/* Transparency Report */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🔍 Relatório de Transparência</Text>
          <Text style={[styles.sectionDesc, { color: colors.muted }]}>
            Análise gerada pelo Assistente Populus com base no perfil parlamentar.
          </Text>

          {!reportRequested ? (
            <TouchableOpacity
              style={[styles.generateBtn, { backgroundColor: "#1B4F72" }]}
              onPress={handleRequestReport}
            >
              <IconSymbol name="sparkles" size={16} color="#fff" />
              <Text style={styles.generateBtnText}>Gerar Relatório com IA</Text>
            </TouchableOpacity>
          ) : transparencyMutation.isPending ? (
            <View style={styles.loadingReport}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.muted }]}>Analisando perfil parlamentar...</Text>
            </View>
          ) : report ? (
            <View style={styles.reportContent}>
              {/* Score */}
              <View style={[styles.scoreCard, { backgroundColor: getScoreColor(report.receptivityScore) + "15" }]}>
                <Text style={[styles.scoreLabel, { color: colors.muted }]}>Índice de Receptividade</Text>
                <Text style={[styles.scoreValue, { color: getScoreColor(report.receptivityScore) }]}>
                  {report.receptivityScore}/100
                </Text>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreBarFill, { width: `${report.receptivityScore}%`, backgroundColor: getScoreColor(report.receptivityScore) }]} />
                </View>
              </View>

              {/* Voting Alignment */}
              <View style={[styles.reportItem, { borderColor: colors.border }]}>
                <Text style={[styles.reportLabel, { color: colors.muted }]}>Alinhamento de Voto</Text>
                <Text style={[styles.reportValue, { color: colors.foreground }]}>{report.votingAlignment}</Text>
              </View>

              {/* Overall Assessment */}
              <View style={[styles.reportItem, { borderColor: colors.border }]}>
                <Text style={[styles.reportLabel, { color: colors.muted }]}>Avaliação Geral</Text>
                <Text style={[styles.reportValue, { color: colors.foreground }]}>{report.overallAssessment}</Text>
              </View>

              {/* Recommendations */}
              {report.recommendations && report.recommendations.length > 0 && (
                <View style={[styles.reportItem, { borderColor: colors.border }]}>
                  <Text style={[styles.reportLabel, { color: colors.muted }]}>Recomendações de Abordagem</Text>
                  {report.recommendations.map((rec: string, idx: number) => (
                    <View key={idx} style={styles.bulletItem}>
                      <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
                      <Text style={[styles.bulletText, { color: colors.foreground }]}>{rec}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Contact Tips */}
              {report.contactTips && report.contactTips.length > 0 && (
                <View style={[styles.reportItem, { borderColor: colors.border }]}>
                  <Text style={[styles.reportLabel, { color: colors.muted }]}>Dicas de Contato</Text>
                  {report.contactTips.map((tip: string, idx: number) => (
                    <View key={idx} style={styles.bulletItem}>
                      <Text style={[styles.bullet, { color: "#27AE60" }]}>✓</Text>
                      <Text style={[styles.bulletText, { color: colors.foreground }]}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.error }]}>Erro ao gerar relatório. Tente novamente.</Text>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  backText: { fontSize: 14, fontWeight: "600" },
  deputyHeader: { borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 16 },
  deputyAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  deputyAvatarText: { fontSize: 28, fontWeight: "700", color: "#fff" },
  deputyName: { fontSize: 18, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 10 },
  deputyBadges: { flexDirection: "row", gap: 8, marginBottom: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  emailBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  emailBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  section: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  sectionDesc: { fontSize: 13, marginBottom: 14, lineHeight: 18 },
  voteItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  voteIcon: { fontSize: 18, marginTop: 2 },
  voteInfo: { flex: 1 },
  voteBill: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  voteDate: { fontSize: 11, marginTop: 2 },
  emptyText: { fontSize: 13, textAlign: "center", marginVertical: 16, lineHeight: 20 },
  generateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10 },
  generateBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  loadingReport: { alignItems: "center", gap: 10, paddingVertical: 20 },
  loadingText: { fontSize: 13 },
  reportContent: { gap: 12 },
  scoreCard: { borderRadius: 10, padding: 14, alignItems: "center" },
  scoreLabel: { fontSize: 12, marginBottom: 4 },
  scoreValue: { fontSize: 32, fontWeight: "800", marginBottom: 8 },
  scoreBar: { width: "100%", height: 6, backgroundColor: "#E0E0E0", borderRadius: 3, overflow: "hidden" },
  scoreBarFill: { height: "100%", borderRadius: 3 },
  reportItem: { paddingTop: 12, borderTopWidth: 1, gap: 6 },
  reportLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  reportValue: { fontSize: 14, lineHeight: 20 },
  bulletItem: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  bullet: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
