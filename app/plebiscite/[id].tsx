import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function LobbyPlebisciteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lobbyId = Number(id);
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [voting, setVoting] = useState(false);

  const { data: lobby } = trpc.lobbies.byId.useQuery({ id: lobbyId });
  const { data: plebiscite, refetch } = trpc.plebiscites.byLobby.useQuery({ lobbyId });
  const { data: hasVoted } = trpc.plebiscites.hasVoted.useQuery(
    { plebisciteId: plebiscite?.id ?? 0 },
    { enabled: !!plebiscite && !!user }
  );

  const activateMutation = trpc.plebiscites.activate.useMutation({
    onSuccess: () => { refetch(); },
    onError: (err) => Alert.alert("Erro", err.message),
  });

  const voteMutation = trpc.plebiscites.vote.useMutation({
    onSuccess: () => { refetch(); setVoting(false); },
    onError: (err) => { Alert.alert("Erro", err.message); setVoting(false); },
  });

  if (!lobby) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  const supportCount = lobby.supportCount ?? 0;
  const threshold = 5000;
  const progressPercent = Math.min((supportCount / threshold) * 100, 100);
  const canActivate = supportCount >= threshold && !plebiscite;

  const totalVotes = plebiscite ? (plebiscite.yesVotes + plebiscite.noVotes) : 0;
  const yesPercent = totalVotes > 0 ? Math.round((plebiscite!.yesVotes / totalVotes) * 100) : 0;
  const noPercent = totalVotes > 0 ? 100 - yesPercent : 0;

  const isActive = plebiscite?.status === "active";
  const isApproved = plebiscite?.status === "approved";
  const isExpired = plebiscite?.status === "expired";

  const handleVote = (vote: "yes" | "no") => {
    if (!user) { Alert.alert("Faça login", "Você precisa estar logado para votar."); return; }
    if (!plebiscite) return;
    setVoting(true);
    voteMutation.mutate({ plebisciteId: plebiscite.id, vote });
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <BackButton onPress={() => router.back()} label="Voltar ao Lobby" />

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.lobbyTitle, { color: colors.foreground }]}>{lobby.title}</Text>
          <View style={[styles.badge, { backgroundColor: "#1E3A8A" }]}>
            <Text style={styles.badgeText}>Plebiscito Popular</Text>
          </View>
        </View>

        {/* Activation Section — shown when no plebiscite yet */}
        {!plebiscite && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Ativar Plebiscito
            </Text>
            <Text style={[styles.description, { color: colors.muted }]}>
              Quando um lobby atinge 5.000 apoios, a comunidade pode votar para torná-lo uma
              {" "}<Text style={{ fontWeight: "700", color: "#1E3A8A" }}>Pauta Prioritária do Populus</Text>,
              ganhando destaque na página inicial por 7 dias e uma campanha de pressão em massa.
            </Text>

            {/* Progress bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={[styles.progressLabel, { color: colors.foreground }]}>
                  {supportCount.toLocaleString("pt-BR")} apoios
                </Text>
                <Text style={[styles.progressLabel, { color: colors.muted }]}>
                  Meta: {threshold.toLocaleString("pt-BR")}
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercent}%` as any,
                      backgroundColor: canActivate ? "#10B981" : "#1E3A8A",
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressPercent, { color: colors.muted }]}>
                {progressPercent.toFixed(0)}% da meta atingida
              </Text>
            </View>

            {canActivate ? (
              <TouchableOpacity
                style={[styles.activateBtn, { backgroundColor: "#10B981" }]}
                onPress={() => activateMutation.mutate({ lobbyId })}
                disabled={activateMutation.isPending}
              >
                {activateMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.activateBtnText}>🗳️ Ativar Plebiscito Agora</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={[styles.lockedBox, { backgroundColor: colors.border }]}>
                <Text style={[styles.lockedText, { color: colors.muted }]}>
                  Faltam {Math.max(0, threshold - supportCount).toLocaleString("pt-BR")} apoios para ativar o plebiscito
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Active Plebiscite */}
        {plebiscite && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Status banner */}
            {isApproved && (
              <View style={[styles.statusBanner, { backgroundColor: "#10B981" }]}>
                <Text style={styles.statusBannerText}>✅ APROVADO — Este lobby é Pauta Prioritária!</Text>
              </View>
            )}
            {isExpired && (
              <View style={[styles.statusBanner, { backgroundColor: colors.muted }]}>
                <Text style={styles.statusBannerText}>⏰ Plebiscito encerrado</Text>
              </View>
            )}
            {isActive && (
              <View style={[styles.statusBanner, { backgroundColor: "#1E3A8A" }]}>
                <Text style={styles.statusBannerText}>🗳️ Votação em andamento</Text>
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {plebiscite.title}
            </Text>
            <Text style={[styles.description, { color: colors.muted }]}>
              {plebiscite.description}
            </Text>

            {/* Vote counts */}
            <View style={styles.voteResults}>
              {/* YES */}
              <View style={styles.voteColumn}>
                <Text style={[styles.voteLabel, { color: "#10B981" }]}>A FAVOR</Text>
                <Text style={[styles.voteCount, { color: "#10B981" }]}>
                  {plebiscite.yesVotes.toLocaleString("pt-BR")}
                </Text>
                <View style={[styles.voteBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.voteBarFill,
                      { width: `${yesPercent}%` as any, backgroundColor: "#10B981" },
                    ]}
                  />
                </View>
                <Text style={[styles.votePercent, { color: "#10B981" }]}>{yesPercent}%</Text>
              </View>

              {/* NO */}
              <View style={styles.voteColumn}>
                <Text style={[styles.voteLabel, { color: "#EF4444" }]}>CONTRA</Text>
                <Text style={[styles.voteCount, { color: "#EF4444" }]}>
                  {plebiscite.noVotes.toLocaleString("pt-BR")}
                </Text>
                <View style={[styles.voteBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.voteBarFill,
                      { width: `${noPercent}%` as any, backgroundColor: "#EF4444" },
                    ]}
                  />
                </View>
                <Text style={[styles.votePercent, { color: "#EF4444" }]}>{noPercent}%</Text>
              </View>
            </View>

            <Text style={[styles.totalVotes, { color: colors.muted }]}>
              Total: {totalVotes.toLocaleString("pt-BR")} votos
            </Text>

            {/* Voting buttons */}
            {isActive && !hasVoted && user && (
              <View style={styles.voteButtons}>
                <TouchableOpacity
                  style={[styles.voteBtn, { backgroundColor: "#10B981" }]}
                  onPress={() => handleVote("yes")}
                  disabled={voting}
                >
                  <Text style={styles.voteBtnText}>👍 Sim, deve ser Pauta Prioritária</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.voteBtn, { backgroundColor: "#EF4444" }]}
                  onPress={() => handleVote("no")}
                  disabled={voting}
                >
                  <Text style={styles.voteBtnText}>👎 Não, ainda não</Text>
                </TouchableOpacity>
              </View>
            )}

            {hasVoted && (
              <View style={[styles.votedBox, { backgroundColor: colors.border }]}>
                <Text style={[styles.votedText, { color: colors.muted }]}>
                  ✅ Você já votou neste plebiscito
                </Text>
              </View>
            )}

            {!user && isActive && (
              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: "#1E3A8A" }]}
                onPress={() => router.push("/(tabs)/profile" as any)}
              >
                <Text style={styles.loginBtnText}>Faça login para votar</Text>
              </TouchableOpacity>
            )}

            {/* Approval criteria */}
            <View style={[styles.criteriaBox, { borderColor: colors.border }]}>
              <Text style={[styles.criteriaTitle, { color: colors.foreground }]}>Critério de Aprovação</Text>
              <Text style={[styles.criteriaText, { color: colors.muted }]}>
                Aprovado quando ≥ 66% dos votos forem a favor, com mínimo de 100 votos.
                {isApproved ? " ✅ Critério atingido!" : ` Atual: ${yesPercent}% a favor.`}
              </Text>
            </View>
          </View>
        )}

        {/* What happens if approved */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            🏆 Se aprovado, o lobby ganha:
          </Text>
          {[
            { icon: "⭐", text: "Destaque na página inicial por 7 dias" },
            { icon: "📢", text: "Campanha de pressão em massa para todos os usuários da região" },
            { icon: "🤝", text: "Articulação automática com lobbys similares" },
            { icon: "🏛️", text: "Notificação enviada aos parlamentares alvo" },
          ].map((item, i) => (
            <View key={i} style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>{item.icon}</Text>
              <Text style={[styles.benefitText, { color: colors.foreground }]}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 14, fontWeight: "600" },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  lobbyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  progressSection: { marginBottom: 16 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: 13, fontWeight: "600" },
  progressBar: { height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: "100%", borderRadius: 5 },
  progressPercent: { fontSize: 12, textAlign: "right" },
  activateBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  activateBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  lockedBox: {
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  lockedText: { fontSize: 13, textAlign: "center" },
  statusBanner: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  statusBannerText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  voteResults: { flexDirection: "row", gap: 12, marginBottom: 12 },
  voteColumn: { flex: 1 },
  voteLabel: { fontSize: 11, fontWeight: "700", marginBottom: 4, textAlign: "center" },
  voteCount: { fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  voteBar: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 4 },
  voteBarFill: { height: "100%", borderRadius: 4 },
  votePercent: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  totalVotes: { fontSize: 12, textAlign: "center", marginBottom: 16 },
  voteButtons: { gap: 10, marginBottom: 12 },
  voteBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  voteBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  votedBox: {
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  votedText: { fontSize: 13, fontWeight: "600" },
  loginBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  loginBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  criteriaBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  criteriaTitle: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  criteriaText: { fontSize: 12, lineHeight: 18 },
  benefitRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, gap: 10 },
  benefitIcon: { fontSize: 18 },
  benefitText: { fontSize: 14, flex: 1, lineHeight: 20 },
});
