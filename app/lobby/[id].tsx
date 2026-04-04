import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { QRCodeModal } from "@/components/ui/qrcode-modal";
import { useTour } from "@/contexts/tour-context";

const { width } = Dimensions.get("window");

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function LobbyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lobbyId = parseInt(id ?? "0");
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();
  const goBack = useSmartBack("/(tabs)");
  const utils = trpc.useUtils();
  const { currentStep, setSupportButtonLayout } = useTour();
  const supportBtnRef = useRef<View>(null);

  const { data: lobby, isLoading } = trpc.lobbies.byId.useQuery({ id: lobbyId });
  const { data: article } = trpc.constitution.byId.useQuery(
    { id: lobby?.constitutionArticleId ?? 0 },
    { enabled: !!lobby?.constitutionArticleId }
  );
  const { data: isSupporting, refetch: refetchSupporting } = trpc.lobbies.isSupporting.useQuery(
    { lobbyId },
    { enabled: isAuthenticated }
  );
  const { data: alliances } = trpc.lobbies.alliances.useQuery({ lobbyId });
  const { data: milestones } = trpc.milestones.list.useQuery({ lobbyId });
  const { data: timeline } = trpc.timeline.list.useQuery({ lobbyId });
  const { data: geoData } = trpc.geo.lobbySupports.useQuery({ lobbyId });
  const { data: plebiscite } = trpc.plebiscites.byLobby.useQuery({ lobbyId });
  const { data: relatedLobbies } = trpc.priorityAgenda.relatedLobbies.useQuery({ lobbyId, limit: 3 });
  const [activeTab, setActiveTab] = useState<"info" | "timeline" | "geo">("info");
  const [showQR, setShowQR] = useState(false);

  const supportMutation = trpc.lobbies.support.useMutation({
    onSuccess: () => {
      refetchSupporting();
      utils.lobbies.byId.invalidate({ id: lobbyId });
    },
  });
  const unsupportMutation = trpc.lobbies.unsupport.useMutation({
    onSuccess: () => {
      refetchSupporting();
      utils.lobbies.byId.invalidate({ id: lobbyId });
    },
  });

  const handleSupport = () => {
    if (!isAuthenticated) {
      Alert.alert("Login necessário", "Faça login para apoiar este lobby.", [
        { text: "Cancelar", style: "cancel" },
        { text: "Entrar", onPress: () => router.push("/(tabs)/profile") },
      ]);
      return;
    }
    if (isSupporting) {
      unsupportMutation.mutate({ lobbyId });
    } else {
      supportMutation.mutate({ lobbyId });
    }
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

  if (!lobby) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: colors.muted }]}>Lobby não encontrado</Text>
        </View>
      </ScreenContainer>
    );
  }

  const categoryColor = lobby.category === "national" ? colors.primary : colors.secondary;
  const categoryLabel = lobby.category === "national" ? "Nacional" : "Local";
  const statusLabel = lobby.status === "active" ? "Ativo" : lobby.status === "pending" ? "Pendente" : lobby.status === "rejected" ? "Rejeitado" : "Encerrado";
  const statusColor = lobby.status === "active" ? colors.success : lobby.status === "pending" ? colors.warning : colors.error;

  const isMutating = supportMutation.isPending || unsupportMutation.isPending;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <BackButton
            label="Voltar"
            variant="dark"
            onPress={goBack}
            style={styles.backBtnOverride}
          />

          <View style={styles.heroBadges}>
            <View style={[styles.categoryBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <IconSymbol
                name={lobby.category === "national" ? "building.columns.fill" : "mappin"}
                size={12}
                color="#FFFFFF"
              />
              <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "30", borderColor: statusColor + "60" }]}>
              <Text style={[styles.statusText, { color: "#FFFFFF" }]}>{statusLabel}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{lobby.title}</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <IconSymbol name="hand.thumbsup.fill" size={18} color="#FFFFFF" />
              <Text style={styles.heroStatText}>
                {lobby.supportCount >= 1000
                  ? `${(lobby.supportCount / 1000).toFixed(1)}k`
                  : lobby.supportCount} apoios
              </Text>
            </View>
            <View style={styles.heroStat}>
              <IconSymbol name="eye.fill" size={18} color="rgba(255,255,255,0.8)" />
              <Text style={[styles.heroStatText, { color: "rgba(255,255,255,0.8)" }]}>
                {lobby.viewCount >= 1000 ? `${(lobby.viewCount / 1000).toFixed(1)}k` : lobby.viewCount} visualizações
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Legal Foundation */}
          {article && (
            <View style={[styles.legalCard, { backgroundColor: colors.accent + "10", borderColor: colors.accent + "30" }]}>
              <View style={styles.legalHeader}>
                <IconSymbol name="scale.3d" size={20} color={colors.accent} />
                <Text style={[styles.legalHeaderTitle, { color: colors.accent }]}>Fundamento Legal</Text>
              </View>
              <Text style={[styles.legalArticle, { color: colors.foreground }]}>
                {article.articleNumber} — {article.title}
              </Text>
              <Text style={[styles.legalSummary, { color: colors.muted }]}>
                {article.summary}
              </Text>
              <Pressable
                onPress={() => router.push(`/constitution`)}
                style={[styles.legalLink, { borderColor: colors.accent + "40" }]}
              >
                <Text style={[styles.legalLinkText, { color: colors.accent }]}>
                  Ver artigo completo
                </Text>
                <IconSymbol name="chevron.right" size={14} color={colors.accent} />
              </Pressable>
            </View>
          )}

          {/* Description */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Descrição</Text>
            <Text style={[styles.sectionText, { color: colors.muted }]}>{lobby.description}</Text>
          </View>

          {/* Objective */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.objectiveHeader}>
              <IconSymbol name="flag.fill" size={18} color={colors.secondary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Objetivo</Text>
            </View>
            <Text style={[styles.sectionText, { color: colors.muted }]}>{lobby.objective}</Text>
          </View>

          {/* Location (for local lobbies) */}
          {lobby.category === "local" && lobby.latitude && lobby.longitude && (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.objectiveHeader}>
                <IconSymbol name="location.fill" size={18} color={colors.secondary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Localização</Text>
              </View>
              {lobby.locationAddress && (
                <Text style={[styles.sectionText, { color: colors.muted }]}>{lobby.locationAddress}</Text>
              )}
              {lobby.locationCity && (
                <Text style={[styles.locationDetail, { color: colors.muted }]}>
                  {lobby.locationCity}{lobby.locationState ? `, ${lobby.locationState}` : ""}
                </Text>
              )}

              {/* Map (native only) */}
              {Platform.OS !== "web" && (() => {
                const MapView = require("react-native-maps").default;
                const { Marker } = require("react-native-maps");
                return (
                  <View style={styles.mapContainer}>
                    <MapView
                      style={styles.map}
                      initialRegion={{
                        latitude: parseFloat(String(lobby.latitude)),
                        longitude: parseFloat(String(lobby.longitude)),
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                    >
                      <Marker
                        coordinate={{
                          latitude: parseFloat(String(lobby.latitude)),
                          longitude: parseFloat(String(lobby.longitude)),
                        }}
                        title={lobby.title}
                      />
                    </MapView>
                  </View>
                );
              })()}
            </View>
          )}

          {/* Progress / Goal Section */}
          {milestones && milestones.length > 0 && (() => {
            const totalGoal = milestones[milestones.length - 1]?.targetCount ?? 1;
            const progress = Math.min(lobby.supportCount / totalGoal, 1);
            const nextMilestone = milestones.find((m) => !m.reachedAt);
            return (
              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.objectiveHeader}>
                  <IconSymbol name="chart.bar.fill" size={18} color={colors.success} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Progresso da Campanha</Text>
                </View>
                <View style={styles.progressRow}>
                  <Text style={[styles.progressCount, { color: colors.foreground }]}>{lobby.supportCount.toLocaleString("pt-BR")}</Text>
                  <Text style={[styles.progressGoal, { color: colors.muted }]}>/ {totalGoal.toLocaleString("pt-BR")} apoios</Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: colors.success }]} />
                </View>
                <Text style={[styles.progressPercent, { color: colors.success }]}>{Math.round(progress * 100)}% da meta</Text>
                {nextMilestone && (
                  <View style={[styles.milestoneCard, { backgroundColor: colors.success + "10", borderColor: colors.success + "30" }]}>
                    <Text style={[styles.milestoneTitle, { color: colors.success }]}>🏆 Próximo marco: {nextMilestone.title}</Text>
                    <Text style={[styles.milestoneDesc, { color: colors.muted }]}>Faltam {Math.max(0, nextMilestone.targetCount - lobby.supportCount).toLocaleString("pt-BR")} apoios</Text>
                    {nextMilestone.reward && <Text style={[styles.milestoneReward, { color: colors.success }]}>Recompensa: {nextMilestone.reward}</Text>}
                  </View>
                )}
                <View style={styles.milestonesRow}>
                  {milestones.map((m) => (
                    <View key={m.id} style={[styles.milestoneDot, { backgroundColor: m.reachedAt ? colors.success : colors.border }]}>
                      <Text style={styles.milestoneDotText}>{m.reachedAt ? "✓" : "○"}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}

          {/* Dashboard Tabs */}
          <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {(["info", "timeline", "geo"] as const).map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.muted }]}>
                  {tab === "info" ? "Informações" : tab === "timeline" ? "Linha do Tempo" : "Mapa de Apoios"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab: Info */}
          {activeTab === "info" && (
            <>
          {/* Alliances */}
          {alliances && alliances.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.objectiveHeader}>
                <IconSymbol name="person.3.fill" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Comunidades Aliadas ({alliances.length})
                </Text>
              </View>
              <Text style={[styles.sectionText, { color: colors.muted }]}>
                {alliances.length} comunidade{alliances.length !== 1 ? "s" : ""} apoiando este lobby
              </Text>
            </View>
          )}

          {/* Metadata */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Informações</Text>
            <View style={styles.metaRow}>
              <IconSymbol name="calendar" size={15} color={colors.muted} />
              <Text style={[styles.metaText, { color: colors.muted }]}>
                Criado em {formatDate(lobby.createdAt)}
              </Text>
            </View>
          </View>
            </>
          )}

          {/* Tab: Timeline */}
          {activeTab === "timeline" && (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.objectiveHeader}>
                <IconSymbol name="clock.fill" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Linha do Tempo</Text>
              </View>
              {!timeline || timeline.length === 0 ? (
                <Text style={[styles.sectionText, { color: colors.muted }]}>Nenhum evento registrado ainda.</Text>
              ) : (
                timeline.map((event, idx) => (
                  <View key={event.id} style={styles.timelineItem}>
                    <View style={styles.timelineLine}>
                      <View style={[styles.timelineDot, { backgroundColor: event.type === "milestone" ? colors.success : event.type === "concluded" ? colors.primary : colors.muted }]} />
                      {idx < timeline.length - 1 && <View style={[styles.timelineConnector, { backgroundColor: colors.border }]} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineTitle, { color: colors.foreground }]}>{event.title}</Text>
                      {event.description && <Text style={[styles.timelineDesc, { color: colors.muted }]}>{event.description}</Text>}
                      <Text style={[styles.timelineDate, { color: colors.muted }]}>{formatDate(event.createdAt)}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Tab: Geo Heatmap */}
          {activeTab === "geo" && (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.objectiveHeader}>
                <IconSymbol name="map.fill" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Apoios por Estado</Text>
              </View>
              {!geoData || geoData.length === 0 ? (
                <Text style={[styles.sectionText, { color: colors.muted }]}>Nenhum dado geográfico disponível ainda.</Text>
              ) : (
                geoData
                  .filter((g) => g.state)
                  .sort((a, b) => Number(b.count) - Number(a.count))
                  .map((g) => {
                    const maxCount = Math.max(...geoData.map((x) => Number(x.count)));
                    const pct = maxCount > 0 ? (Number(g.count) / maxCount) * 100 : 0;
                    return (
                      <View key={g.state} style={styles.geoRow}>
                        <Text style={[styles.geoState, { color: colors.foreground }]}>{g.state}</Text>
                        <View style={[styles.geoBar, { backgroundColor: colors.border }]}>
                          <View style={[styles.geoBarFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
                        </View>
                        <Text style={[styles.geoCount, { color: colors.muted }]}>{g.count}</Text>
                      </View>
                    );
                  })
              )}
            </View>
          )}

          {/* Plebiscito do Lobby */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.objectiveHeader}>
              <Text style={{ fontSize: 18 }}>🗳️</Text>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Plebiscito Popular</Text>
            </View>
            {plebiscite ? (
              <>
                <View style={[styles.plebisciteStatus, {
                  backgroundColor: plebiscite.status === "approved" ? "#10B98120" :
                    plebiscite.status === "active" ? "#1E3A8A20" : "#6B728020",
                  borderColor: plebiscite.status === "approved" ? "#10B981" :
                    plebiscite.status === "active" ? "#1E3A8A" : "#6B7280",
                }]}>
                  <Text style={[styles.plebisciteStatusText, {
                    color: plebiscite.status === "approved" ? "#10B981" :
                      plebiscite.status === "active" ? "#1E3A8A" : colors.muted,
                  }]}>
                    {plebiscite.status === "approved" ? "✅ Pauta Prioritária Aprovada!" :
                      plebiscite.status === "active" ? "🗳️ Votação em andamento" : "⏰ Plebiscito encerrado"}
                  </Text>
                  <Text style={[styles.plebisciteVotes, { color: colors.muted }]}>
                    {plebiscite.yesVotes} a favor • {plebiscite.noVotes} contra
                  </Text>
                </View>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: "#1E3A8A15", borderColor: "#1E3A8A40" }]}
                  onPress={() => router.push(`/plebiscite/${lobbyId}` as any)}
                >
                  <Text style={[styles.actionBtnText, { color: "#1E3A8A" }]}>Ver plebiscito e votar</Text>
                  <IconSymbol name="chevron.right" size={14} color="#1E3A8A" />
                </Pressable>
              </>
            ) : (
              <>
                <Text style={[styles.sectionText, { color: colors.muted }]}>
                  Com 5.000 apoios, a comunidade pode votar para tornar este lobby uma Pauta Prioritária do Populus.
                  Atualmente: {lobby.supportCount.toLocaleString("pt-BR")} / 5.000 apoios.
                </Text>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: "#6B21A815", borderColor: "#6B21A840" }]}
                  onPress={() => router.push(`/plebiscite/${lobbyId}` as any)}
                >
                  <Text style={[styles.actionBtnText, { color: "#6B21A8" }]}>Ver detalhes do plebiscito</Text>
                  <IconSymbol name="chevron.right" size={14} color="#6B21A8" />
                </Pressable>
              </>
            )}
          </View>

          {/* Lobbys Similares */}
          {relatedLobbies && relatedLobbies.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.objectiveHeader}>
                <IconSymbol name="person.3.fill" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Lobbys Similares</Text>
              </View>
              <Text style={[styles.sectionText, { color: colors.muted }]} numberOfLines={2}>
                Articule-se com outros lobbys sobre o mesmo tema para ampliar o impacto.
              </Text>
              {relatedLobbies.map(related => (
                <Pressable
                  key={related.id}
                  style={[styles.relatedLobbyCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => router.push(`/lobby/${related.id}` as any)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.relatedLobbyTitle, { color: colors.foreground }]} numberOfLines={2}>
                      {related.title}
                    </Text>
                    <Text style={[styles.relatedLobbyCount, { color: colors.muted }]}>
                      {related.supportCount.toLocaleString("pt-BR")} apoios
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={14} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Parlamentares Alvo */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.objectiveHeader}>
              <IconSymbol name="building.columns.fill" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Parlamentares Alvo</Text>
            </View>
            <Text style={[styles.sectionText, { color: colors.muted }]}>
              {lobby.category === "national"
                ? "Comissão de Constituição e Justiça (CCJ) • Líderes de bancada • Relator do projeto"
                : `Vereadores de ${lobby.locationCity ?? "sua cidade"} • Secretaria Municipal competente`}
            </Text>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}
              onPress={() => Alert.alert("Em breve", "Integração com dados de parlamentares será adicionada em breve.")}
            >
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Ver parlamentares relacionados</Text>
              <IconSymbol name="chevron.right" size={14} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Action Bar */}
      <View style={[styles.supportBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.supportCount}>
          <Text style={[styles.supportCountNumber, { color: colors.foreground }]}>
            {lobby.supportCount >= 1000
              ? `${(lobby.supportCount / 1000).toFixed(1)}k`
              : lobby.supportCount}
          </Text>
          <Text style={[styles.supportCountLabel, { color: colors.muted }]}>apoios</Text>
        </View>
        <View
          ref={supportBtnRef}
          onLayout={() => {
            if (currentStep === "support_lobby" && supportBtnRef.current) {
              supportBtnRef.current.measure((_x, _y, width, height, pageX, pageY) => {
                setSupportButtonLayout({ x: pageX, y: pageY, width, height });
              });
            }
          }}
        >
        <Pressable
          onPress={handleSupport}
          disabled={isMutating}
          style={({ pressed }) => [
            styles.supportBtn,
            {
              backgroundColor: isSupporting ? colors.muted : colors.secondary,
              opacity: pressed || isMutating ? 0.8 : 1,
            },
          ]}
        >
          {isMutating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol
                name={isSupporting ? "checkmark.circle.fill" : "hand.thumbsup.fill"}
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.supportBtnText}>
                {isSupporting ? "Apoiando" : "Apoiar"}
              </Text>
            </>
          )}
        </Pressable>
        </View>
        <Pressable
          onPress={() => router.push(`/pressure/${lobbyId}` as any)}
          style={({ pressed }) => [
            styles.pressureBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <IconSymbol name="megaphone.fill" size={18} color="#fff" />
          <Text style={styles.pressureBtnText}>Pressionar</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/populus" as any)}
          style={({ pressed }) => [
            styles.populusBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.populusBtnIcon}>🤖</Text>
          <Text style={styles.populusBtnText}>Populus</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowQR(true)}
          style={({ pressed }) => [
            styles.qrBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <IconSymbol name="qrcode" size={18} color={colors.foreground} />
          <Text style={[styles.qrBtnText, { color: colors.foreground }]}>QR Code</Text>
        </Pressable>
      </View>
      <QRCodeModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        lobbyId={lobbyId}
        lobbyTitle={lobby.title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
  },
  hero: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnOverride: {
    marginLeft: -4,
  },
  heroBadges: {
    flexDirection: "row",
    gap: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30,
  },
  heroStats: {
    flexDirection: "row",
    gap: 16,
  },
  heroStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroStatText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  legalCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  legalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legalHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  legalArticle: {
    fontSize: 16,
    fontWeight: "700",
  },
  legalSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  legalLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    marginTop: 4,
  },
  legalLinkText: {
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  objectiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationDetail: {
    fontSize: 14,
    marginTop: -4,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    height: 160,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 14,
  },
  supportBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  supportCount: {
    alignItems: "center",
  },
  supportCountNumber: {
    fontSize: 22,
    fontWeight: "800",
  },
  supportCountLabel: {
    fontSize: 12,
  },
  supportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  supportBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  // Progress / Milestones
  progressRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 8 },
  progressCount: { fontSize: 28, fontWeight: "800" },
  progressGoal: { fontSize: 14 },
  progressBar: { height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: 10, borderRadius: 5 },
  progressPercent: { fontSize: 13, fontWeight: "700", marginBottom: 12 },
  milestoneCard: { borderRadius: 10, padding: 12, borderWidth: 1, marginBottom: 12 },
  milestoneTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  milestoneDesc: { fontSize: 13, marginBottom: 4 },
  milestoneReward: { fontSize: 12, fontStyle: "italic" },
  milestonesRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  milestoneDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  milestoneDotText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  // Dashboard Tabs
  tabBar: { flexDirection: "row", borderRadius: 10, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabText: { fontSize: 13, fontWeight: "600" },
  // Timeline
  timelineItem: { flexDirection: "row", gap: 12, marginBottom: 16 },
  timelineLine: { alignItems: "center", width: 20 },
  timelineDot: { width: 14, height: 14, borderRadius: 7 },
  timelineConnector: { width: 2, flex: 1, marginTop: 4 },
  timelineContent: { flex: 1 },
  timelineTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  timelineDesc: { fontSize: 13, marginBottom: 4 },
  timelineDate: { fontSize: 11 },
  // Geo Heatmap
  geoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  geoState: { width: 28, fontSize: 13, fontWeight: "700" },
  geoBar: { flex: 1, height: 10, borderRadius: 5, overflow: "hidden" },
  geoBarFill: { height: 10, borderRadius: 5 },
  geoCount: { width: 32, fontSize: 12, textAlign: "right" },
  // Action Button
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 8, padding: 12, borderWidth: 1, marginTop: 8 },
  actionBtnText: { fontSize: 14, fontWeight: "600" },
  // Pressure Button
  pressureBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#C0392B",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
  },
  pressureBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  populusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1a3a5c",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
  populusBtnIcon: { fontSize: 14 },
  populusBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  // Plebiscite
  plebisciteStatus: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8 },
  plebisciteStatusText: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  plebisciteVotes: { fontSize: 12 },
  // Related Lobbies
  relatedLobbyCard: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, padding: 12, marginTop: 8 },
  relatedLobbyTitle: { fontSize: 13, fontWeight: "600", marginBottom: 2, lineHeight: 18 },
  relatedLobbyCount: { fontSize: 11 },
  qrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  qrBtnText: { fontSize: 12, fontWeight: "700" },
});
