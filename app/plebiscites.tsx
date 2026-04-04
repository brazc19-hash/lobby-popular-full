import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

type Plebiscite = {
  id: number;
  title: string;
  description: string;
  category: string;
  status: "active" | "closed" | "sent_to_chamber";
  yesVotes: number;
  noVotes: number;
  endsAt: Date;
};

function PlebisciteCard({
  item,
  onVote,
  onSendToChamber,
  hasVoted,
  isAdmin,
}: {
  item: Plebiscite;
  onVote: (id: number, vote: "yes" | "no") => void;
  onSendToChamber: (id: number) => void;
  hasVoted: boolean;
  isAdmin: boolean;
}) {
  const colors = useColors();
  const totalVotes = item.yesVotes + item.noVotes;
  const yesPercent = totalVotes > 0 ? Math.round((item.yesVotes / totalVotes) * 100) : 0;
  const noPercent = totalVotes > 0 ? 100 - yesPercent : 0;
  const endsAt = new Date(item.endsAt);
  const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const statusColor =
    item.status === "active" ? "#10B981" :
    item.status === "sent_to_chamber" ? "#1E3A8A" : colors.muted as string;

  const statusLabel =
    item.status === "active" ? "Votação Aberta" :
    item.status === "sent_to_chamber" ? "Enviado à Câmara" : "Encerrado";

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
        {item.status === "active" && (
          <Text style={[styles.daysLeft, { color: colors.muted }]}>
            {daysLeft > 0 ? `${daysLeft} dias restantes` : "Último dia!"}
          </Text>
        )}
      </View>

      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
      <Text style={[styles.cardDescription, { color: colors.muted }]} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={[styles.categoryBadge, { backgroundColor: "#1E3A8A20" }]}>
        <Text style={[styles.categoryText, { color: "#1E3A8A" }]}>{item.category}</Text>
      </View>

      {/* Results */}
      <View style={styles.resultsRow}>
        <View style={styles.resultItem}>
          <Text style={[styles.resultLabel, { color: "#10B981" }]}>A FAVOR</Text>
          <Text style={[styles.resultCount, { color: "#10B981" }]}>
            {item.yesVotes.toLocaleString("pt-BR")}
          </Text>
          <View style={[styles.resultBar, { backgroundColor: colors.border }]}>
            <View style={[styles.resultFill, { width: `${yesPercent}%` as any, backgroundColor: "#10B981" }]} />
          </View>
          <Text style={[styles.resultPercent, { color: "#10B981" }]}>{yesPercent}%</Text>
        </View>
        <View style={styles.resultItem}>
          <Text style={[styles.resultLabel, { color: "#EF4444" }]}>CONTRA</Text>
          <Text style={[styles.resultCount, { color: "#EF4444" }]}>
            {item.noVotes.toLocaleString("pt-BR")}
          </Text>
          <View style={[styles.resultBar, { backgroundColor: colors.border }]}>
            <View style={[styles.resultFill, { width: `${noPercent}%` as any, backgroundColor: "#EF4444" }]} />
          </View>
          <Text style={[styles.resultPercent, { color: "#EF4444" }]}>{noPercent}%</Text>
        </View>
      </View>

      <Text style={[styles.totalVotes, { color: colors.muted }]}>
        {totalVotes.toLocaleString("pt-BR")} votos totais
      </Text>

      {/* Vote buttons */}
      {item.status === "active" && !hasVoted && (
        <View style={styles.voteButtons}>
          <TouchableOpacity
            style={[styles.voteBtn, { backgroundColor: "#10B981" }]}
            onPress={() => onVote(item.id, "yes")}
          >
            <Text style={styles.voteBtnText}>👍 Sim</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.voteBtn, { backgroundColor: "#EF4444" }]}
            onPress={() => onVote(item.id, "no")}
          >
            <Text style={styles.voteBtnText}>👎 Não</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasVoted && item.status === "active" && (
        <View style={[styles.votedBox, { backgroundColor: colors.border }]}>
          <Text style={[styles.votedText, { color: colors.muted }]}>✅ Você já votou</Text>
        </View>
      )}

      {/* Send to Chamber button (admin or when closed with many votes) */}
      {(isAdmin || totalVotes >= 50000) && item.status === "closed" && (
        <TouchableOpacity
          style={[styles.chamberBtn, { backgroundColor: "#1E3A8A" }]}
          onPress={() => onSendToChamber(item.id)}
        >
          <Text style={styles.chamberBtnText}>🏛️ Enviar Resultado à Câmara</Text>
        </TouchableOpacity>
      )}

      {item.status === "sent_to_chamber" && (
        <View style={[styles.sentBox, { backgroundColor: "#1E3A8A20" }]}>
          <Text style={[styles.sentText, { color: "#1E3A8A" }]}>
            🏛️ Resultado enviado oficialmente à Câmara dos Deputados
          </Text>
        </View>
      )}
    </View>
  );
}

export default function NationalPlebiscitesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [officialLetter, setOfficialLetter] = useState<string | null>(null);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [sendingToChamber, setSendingToChamber] = useState(false);

  const { data: plebiscites = [], refetch } = trpc.nationalPlebiscites.list.useQuery();

  const voteMutation = trpc.nationalPlebiscites.vote.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => Alert.alert("Erro", err.message),
  });

  const sendToChamberMutation = trpc.nationalPlebiscites.sendToChamber.useMutation({
    onSuccess: (data) => {
      setSendingToChamber(false);
      setOfficialLetter(data.officialLetter);
      setShowLetterModal(true);
      refetch();
    },
    onError: (err) => {
      setSendingToChamber(false);
      Alert.alert("Erro", err.message);
    },
  });

  const handleVote = (plebisciteId: number, vote: "yes" | "no") => {
    if (!user) {
      Alert.alert("Faça login", "Você precisa estar logado para votar.");
      return;
    }
    voteMutation.mutate({ plebisciteId, vote });
  };

  const handleSendToChamber = (plebisciteId: number) => {
    Alert.alert(
      "Enviar à Câmara",
      "Deseja gerar e enviar o ofício oficial com o resultado deste plebiscito para a Câmara dos Deputados?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar",
          onPress: () => {
            setSendingToChamber(true);
            sendToChamberMutation.mutate({ plebisciteId });
          },
        },
      ]
    );
  };

  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <BackButton onPress={() => router.back()} label="Voltar" />

        <View style={styles.headerSection}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>
            🗳️ Plebiscitos Nacionais
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.muted }]}>
            Consultas populares sobre temas nacionais. Os resultados são encaminhados
            oficialmente à Câmara dos Deputados como manifestação popular organizada,
            com base no Art. 14 da Constituição Federal.
          </Text>
        </View>

        {/* Constitutional basis */}
        <View style={[styles.constitutionBox, { backgroundColor: "#1E3A8A10", borderColor: "#1E3A8A40" }]}>
          <Text style={[styles.constitutionTitle, { color: "#1E3A8A" }]}>
            📜 Art. 14 — Soberania Popular
          </Text>
          <Text style={[styles.constitutionText, { color: colors.muted }]}>
            "A soberania popular será exercida pelo sufrágio universal e pelo voto direto e secreto,
            com valor igual para todos, e, nos termos da lei, mediante: I - plebiscito; II - referendo;
            III - iniciativa popular."
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: "#1E3A8A" }]}>{plebiscites.length}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Plebiscitos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: "#10B981" }]}>
              {plebiscites.reduce((sum, p) => sum + p.yesVotes + p.noVotes, 0).toLocaleString("pt-BR")}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Votos Totais</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: "#F59E0B" }]}>
              {plebiscites.filter(p => p.status === "sent_to_chamber").length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Enviados à Câmara</Text>
          </View>
        </View>

        {/* Plebiscite list */}
        {plebiscites.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Nenhum plebiscito nacional disponível no momento.
            </Text>
          </View>
        ) : (
          plebiscites.map((item) => (
            <PlebisciteCard
              key={item.id}
              item={item as Plebiscite}
              onVote={handleVote}
              onSendToChamber={handleSendToChamber}
              hasVoted={false} // TODO: check per item
              isAdmin={isAdmin}
            />
          ))
        )}

        {sendingToChamber && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Gerando ofício oficial...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Official Letter Modal */}
      <Modal visible={showLetterModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              🏛️ Ofício Enviado à Câmara
            </Text>
            <TouchableOpacity onPress={() => setShowLetterModal(false)}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>Fechar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={[styles.letterBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.letterText, { color: colors.foreground }]}>
                {officialLetter}
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 14, fontWeight: "600" },
  headerSection: { marginBottom: 16 },
  screenTitle: { fontSize: 22, fontWeight: "800", marginBottom: 6 },
  screenSubtitle: { fontSize: 14, lineHeight: 20 },
  constitutionBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  constitutionTitle: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  constitutionText: { fontSize: 13, lineHeight: 19, fontStyle: "italic" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  statNumber: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2, textAlign: "center" },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 12, fontWeight: "700", flex: 1 },
  daysLeft: { fontSize: 11 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, lineHeight: 22 },
  cardDescription: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  categoryText: { fontSize: 12, fontWeight: "600" },
  resultsRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  resultItem: { flex: 1 },
  resultLabel: { fontSize: 11, fontWeight: "700", textAlign: "center", marginBottom: 4 },
  resultCount: { fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  resultBar: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 4 },
  resultFill: { height: "100%", borderRadius: 4 },
  resultPercent: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  totalVotes: { fontSize: 12, textAlign: "center", marginBottom: 14 },
  voteButtons: { flexDirection: "row", gap: 10, marginBottom: 8 },
  voteBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  voteBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  votedBox: { borderRadius: 10, padding: 12, alignItems: "center", marginBottom: 8 },
  votedText: { fontSize: 13, fontWeight: "600" },
  chamberBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  chamberBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  sentBox: { borderRadius: 10, padding: 12, marginTop: 8 },
  sentText: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  emptyBox: { borderRadius: 12, borderWidth: 1, padding: 24, alignItems: "center" },
  emptyText: { fontSize: 14, textAlign: "center" },
  loadingOverlay: { alignItems: "center", padding: 20 },
  loadingText: { marginTop: 10, fontSize: 14 },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalClose: { fontSize: 14, fontWeight: "600" },
  modalContent: { flex: 1, padding: 16 },
  letterBox: { borderWidth: 1, borderRadius: 10, padding: 16 },
  letterText: { fontSize: 14, lineHeight: 22 },
});
