import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet, TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

const URGENCY_COLORS: Record<string, string> = {
  high: "#C0392B",
  medium: "#E67E22",
  low: "#27AE60",
};

const URGENCY_LABELS: Record<string, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const TYPE_ICONS: Record<string, string> = {
  vote: "🗳️",
  hearing: "🎙️",
  committee: "🏛️",
  opportunity: "⚡",
};

export default function CongressAlertsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [lobbyTitle, setLobbyTitle] = useState("saúde pública");
  const [submitted, setSubmitted] = useState("saúde pública");

  const alertsQuery = trpc.congress.alerts.useQuery(
    { lobbyTitle: submitted },
    { enabled: !!submitted }
  );

  const alerts = (alertsQuery.data as { alerts?: Array<{ type: string; title: string; date?: string; description: string; urgency: string; action?: string }> })?.alerts ?? [];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={18} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Congresso</Text>
        </TouchableOpacity>

        <View style={[styles.headerCard, { backgroundColor: "#1B4F72" }]}>
          <Text style={styles.headerTitle}>🔔 Alertas Inteligentes</Text>
          <Text style={styles.headerSubtitle}>
            Monitoramento da agenda do Congresso gerado pelo Assistente Populus
          </Text>
        </View>

        {/* Search by topic */}
        <View style={[styles.searchSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.searchLabel, { color: colors.foreground }]}>Tema de interesse</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              value={lobbyTitle}
              onChangeText={setLobbyTitle}
              placeholder="Ex: iluminação pública, saúde..."
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              onSubmitEditing={() => setSubmitted(lobbyTitle)}
            />
            <TouchableOpacity
              style={[styles.searchBtn, { backgroundColor: "#1B4F72" }]}
              onPress={() => setSubmitted(lobbyTitle)}
            >
              <IconSymbol name="magnifyingglass" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Alerts */}
        {alertsQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Analisando agenda do Congresso...</Text>
          </View>
        ) : alerts.length > 0 ? (
          <View style={styles.alertsList}>
            {alerts.map((alert, idx) => (
              <View
                key={idx}
                style={[styles.alertCard, {
                  backgroundColor: colors.surface,
                  borderColor: URGENCY_COLORS[alert.urgency] + "40",
                  borderLeftColor: URGENCY_COLORS[alert.urgency],
                  borderLeftWidth: 4,
                }]}
              >
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTypeIcon}>{TYPE_ICONS[alert.type] ?? "📌"}</Text>
                  <View style={[styles.urgencyBadge, { backgroundColor: URGENCY_COLORS[alert.urgency] + "20" }]}>
                    <Text style={[styles.urgencyText, { color: URGENCY_COLORS[alert.urgency] }]}>
                      Urgência {URGENCY_LABELS[alert.urgency]}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.alertTitle, { color: colors.foreground }]}>{alert.title}</Text>
                {alert.date && (
                  <View style={styles.alertDateRow}>
                    <IconSymbol name="calendar" size={13} color={colors.primary} />
                    <Text style={[styles.alertDate, { color: colors.primary }]}>{alert.date}</Text>
                  </View>
                )}
                <Text style={[styles.alertDesc, { color: colors.muted }]}>{alert.description}</Text>
                {alert.action && (
                  <View style={[styles.actionBox, { backgroundColor: colors.primary + "10" }]}>
                    <Text style={[styles.actionLabel, { color: colors.primary }]}>⚡ Ação recomendada:</Text>
                    <Text style={[styles.actionText, { color: colors.foreground }]}>{alert.action}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Nenhum alerta encontrado para este tema. Tente um tema diferente.
          </Text>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  backText: { fontSize: 14, fontWeight: "600" },
  headerCard: { borderRadius: 14, padding: 18, marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 6 },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 18 },
  searchSection: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 20 },
  searchLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  searchRow: { flexDirection: "row", gap: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  searchBtn: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  loadingContainer: { alignItems: "center", paddingTop: 40, gap: 12 },
  loadingText: { fontSize: 13 },
  alertsList: { gap: 12 },
  alertCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  alertHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  alertTypeIcon: { fontSize: 22 },
  urgencyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  urgencyText: { fontSize: 11, fontWeight: "700" },
  alertTitle: { fontSize: 15, fontWeight: "700", lineHeight: 21, marginBottom: 6 },
  alertDateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  alertDate: { fontSize: 13, fontWeight: "600" },
  alertDesc: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  actionBox: { borderRadius: 8, padding: 10 },
  actionLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  actionText: { fontSize: 13, lineHeight: 18 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 14, lineHeight: 20 },
});
