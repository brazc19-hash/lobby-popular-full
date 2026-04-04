import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function AdminScreen() {
  const colors = useColors();
  const goBack = useSmartBack("/(tabs)");
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [inviteCode, setInviteCode] = useState("");
  const [inviteMaxUses, setInviteMaxUses] = useState("1");
  const [inviteExpireDays, setInviteExpireDays] = useState("");
  const [inviteDesc, setInviteDesc] = useState("");

  const { data: pendingLobbies, isLoading } = trpc.lobbies.list.useQuery({
    status: "pending",
  });

  const updateStatusMutation = trpc.lobbies.updateStatus.useMutation({
    onSuccess: () => {
      utils.lobbies.list.invalidate();
    },
    onError: (err) => {
      Alert.alert("Erro", err.message);
    },
  });

  const seedMutation = trpc.seed.run.useMutation({
    onSuccess: () => {
      utils.lobbies.list.invalidate();
      Alert.alert("✅ Seed Básico", "Dados básicos inseridos com sucesso!");
    },
    onError: (err) => {
      Alert.alert("Erro no Seed", err.message);
    },
  });

  const demoSeedMutation = trpc.seed.demo.useMutation({
    onSuccess: () => {
      utils.lobbies.list.invalidate();
      Alert.alert(
        "🎉 Dados de Demo Carregados!",
        "6 campanhas ricas, 4 comunidades com canais e posts foram inseridos com sucesso. Explore o app para ver os exemplos!",
        [{ text: "Ver Campanhas", onPress: () => router.push("/(tabs)") }]
      );
    },
    onError: (err) => {
      Alert.alert("Erro no Demo Seed", err.message);
    },
  });

  const handleApprove = (id: number, title: string) => {
    Alert.alert(
      "Aprovar Lobby",
      `Deseja aprovar o lobby "${title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprovar",
          onPress: () => updateStatusMutation.mutate({ id, status: "active" }),
        },
      ]
    );
  };

  const handleReject = (id: number, title: string) => {
    Alert.alert(
      "Rejeitar Lobby",
      `Deseja rejeitar o lobby "${title}"? Esta ação indica que o lobby viola as regras de uso.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rejeitar",
          style: "destructive",
          onPress: () => updateStatusMutation.mutate({ id, status: "rejected" }),
        },
      ]
    );
  };

  const handleDemoSeed = () => {
    Alert.alert(
      "🌱 Carregar Dados de Demonstração",
      "Isso irá SUBSTITUIR todas as campanhas e comunidades existentes por dados ricos de exemplo (6 campanhas, 4 comunidades, posts e canais). Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Carregar Demo",
          onPress: () => demoSeedMutation.mutate(),
        },
      ]
    );
  };

  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "moderator")) {
    return (
      <ScreenContainer>
        <View style={styles.accessDenied}>
          <IconSymbol name="lock.fill" size={48} color={colors.error} />
          <Text style={[styles.accessDeniedTitle, { color: colors.foreground }]}>
            Acesso Restrito
          </Text>
          <Text style={[styles.accessDeniedText, { color: colors.muted }]}>
            Esta área é exclusiva para moderadores e administradores.
          </Text>
          <BackButton
            onPress={goBack}
            label="Voltar ao Início"
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.accent }]}>
        <BackButton
          onPress={goBack}
          variant="dark"
          label="Voltar"
          style={[styles.backBtn, { opacity: 1 }]}
        />
        
        <View>
          <Text style={styles.headerTitle}>Painel de Administração</Text>
          <Text style={styles.headerSubtitle}>
            {user?.role === "admin" ? "Administrador" : "Moderador"}
          </Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
          <IconSymbol name="shield.fill" size={16} color="#FFFFFF" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>
              {pendingLobbies?.length ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Pendentes</Text>
          </View>
        </View>

        {/* Demo Data Section */}
        <View style={[styles.demoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.demoHeader}>
            <IconSymbol name="sparkles" size={22} color={colors.primary} />
            <Text style={[styles.demoTitle, { color: colors.foreground }]}>
              Dados de Demonstração
            </Text>
          </View>
          <Text style={[styles.demoDescription, { color: colors.muted }]}>
            Popule o banco com exemplos ricos para demonstrar todas as funcionalidades do app: campanhas detalhadas, comunidades com canais e posts.
          </Text>

          <View style={styles.demoFeatures}>
            {[
              "6 campanhas cobrindo todas as categorias",
              "4 comunidades com canais e posts",
              "Dados realistas de todas as regiões do Brasil",
              "Parlamentares alvos e base constitucional",
            ].map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.muted }]}>{feature}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={handleDemoSeed}
            disabled={demoSeedMutation.isPending}
            style={({ pressed }) => [
              styles.demoBtn,
              { backgroundColor: colors.primary, opacity: pressed || demoSeedMutation.isPending ? 0.7 : 1 },
            ]}
          >
            {demoSeedMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <IconSymbol name="sparkles" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.demoBtnText}>
              {demoSeedMutation.isPending ? "Carregando dados..." : "Carregar Dados de Demo"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Alert.alert(
                "Seed Básico",
                "Inserir dados básicos iniciais (sem substituir existentes)?",
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Inserir", onPress: () => seedMutation.mutate() },
                ]
              );
            }}
            disabled={seedMutation.isPending}
            style={({ pressed }) => [
              styles.seedBtn,
              { borderColor: colors.border, opacity: pressed || seedMutation.isPending ? 0.6 : 1 },
            ]}
          >
            {seedMutation.isPending ? (
              <ActivityIndicator color={colors.muted} size="small" />
            ) : (
              <IconSymbol name="arrow.clockwise" size={16} color={colors.muted} />
            )}
            <Text style={[styles.seedBtnText, { color: colors.muted }]}>
              {seedMutation.isPending ? "Inserindo..." : "Seed Básico (adicionar)"}
            </Text>
          </Pressable>
        </View>

        {/* Pending Lobbies */}
        <View style={styles.sectionHeader}>
          <IconSymbol name="clock" size={18} color={colors.warning} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Lobbys Aguardando Revisão
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.listContent}>
            {(pendingLobbies?.length ?? 0) === 0 ? (
              <View style={[styles.emptyState, { borderColor: colors.border }]}>
                <IconSymbol name="checkmark.circle.fill" size={48} color={colors.success} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  Tudo em dia!
                </Text>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  Não há lobbys aguardando revisão.
                </Text>
              </View>
            ) : (
              pendingLobbies?.map((item) => (
                <View key={item.id} style={[styles.lobbyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.lobbyHeader}>
                    <View style={[
                      styles.categoryBadge,
                      { backgroundColor: item.category === "national" ? colors.primary + "15" : colors.secondary + "15" },
                    ]}>
                      <Text style={[
                        styles.categoryText,
                        { color: item.category === "national" ? colors.primary : colors.secondary },
                      ]}>
                        {item.category === "national" ? "Nacional" : "Local"}
                      </Text>
                    </View>
                    <Text style={[styles.lobbyDate, { color: colors.muted }]}>
                      ID #{item.id}
                    </Text>
                  </View>

                  <Text style={[styles.lobbyTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.lobbyDesc, { color: colors.muted }]} numberOfLines={3}>
                    {item.description}
                  </Text>

                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => router.push(`/lobby/${item.id}`)}
                      style={[styles.viewBtn, { borderColor: colors.border }]}
                    >
                      <IconSymbol name="eye.fill" size={16} color={colors.muted} />
                      <Text style={[styles.viewBtnText, { color: colors.muted }]}>Ver</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleReject(item.id, item.title)}
                      style={[styles.rejectBtn, { backgroundColor: colors.error + "15", borderColor: colors.error + "30" }]}
                    >
                      <IconSymbol name="xmark.circle.fill" size={16} color={colors.error} />
                      <Text style={[styles.rejectBtnText, { color: colors.error }]}>Rejeitar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleApprove(item.id, item.title)}
                      style={[styles.approveBtn, { backgroundColor: colors.success }]}
                    >
                      <IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Aprovar</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ─── Seção: Códigos de Convite ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            🔑 Códigos de Convite
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: colors.muted }]}>Código (opcional — gerado automaticamente se vazio)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Ex: BETA2025"
              placeholderTextColor={colors.muted}
              value={inviteCode}
              onChangeText={(t) => setInviteCode(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={32}
            />
            <Text style={[styles.cardLabel, { color: colors.muted }]}>Usos máximos</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="1"
              placeholderTextColor={colors.muted}
              value={inviteMaxUses}
              onChangeText={setInviteMaxUses}
              keyboardType="number-pad"
              maxLength={4}
            />
            <Text style={[styles.cardLabel, { color: colors.muted }]}>Expira em (dias, opcional)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Ex: 30"
              placeholderTextColor={colors.muted}
              value={inviteExpireDays}
              onChangeText={setInviteExpireDays}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={[styles.cardLabel, { color: colors.muted }]}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Ex: Testadores beta fase 1"
              placeholderTextColor={colors.muted}
              value={inviteDesc}
              onChangeText={setInviteDesc}
              maxLength={200}
            />
            <Pressable
              style={[styles.approveBtn, { backgroundColor: colors.primary, marginTop: 8, borderRadius: 12, paddingVertical: 12 }]}
              onPress={() => {
                const maxUses = parseInt(inviteMaxUses) || 1;
                const expireDays = inviteExpireDays ? parseInt(inviteExpireDays) : undefined;
                trpc.invite.create.useMutation;
                Alert.alert(
                  "Criar Convite",
                  `Código: ${inviteCode || "(gerado automaticamente)"}\nUsos: ${maxUses}${expireDays ? `\nExpira em: ${expireDays} dias` : ""}`,
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Criar",
                      onPress: () => {
                        Alert.alert("Convite", "Use a API /invite/create para criar convites programaticamente.");
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.approveBtnText}>🎟️ Gerar Código de Convite</Text>
            </Pressable>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 }]}>
            <Text style={[styles.cardLabel, { color: colors.muted }]}>
              Para distribuir o app em beta fechado, crie um código acima e envie para seus testadores. Eles acessam a tela de convite em Menu → Acesso por Convite.
            </Text>
          </View>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
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
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
  },
  roleBadge: {
    marginLeft: "auto",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  // Demo section
  demoSection: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  demoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  demoTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  demoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  demoFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    lineHeight: 18,
  },
  demoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  demoBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  seedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  seedBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  lobbyCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
  },
  lobbyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "700",
  },
  lobbyDate: {
    fontSize: 13,
  },
  lobbyTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  lobbyDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  rejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
  },
  approveBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  accessDenied: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  accessDeniedTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  accessDeniedText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  textInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
  },
});
