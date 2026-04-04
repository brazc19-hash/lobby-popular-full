import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { LobbyCard } from "@/components/lobby-card";
import { NewsCard } from "@/components/news-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { FilterSheet, LobbyFilters } from "@/components/filter-sheet";
import { useAuth } from "@/hooks/use-auth";
import { useTour } from "@/contexts/tour-context";
import { HamburgerButton } from "@/components/drawer-menu";

type FilterTab = "all" | "national" | "local";

const CATEGORY_ICONS: Record<string, string> = {
  infrastructure: "🏗️", education: "📚", health: "🏥", security: "🛡️",
  environment: "🌿", human_rights: "✊", economy: "💰", transparency: "👁️", culture: "🎭",
};

function PriorityAgendaSection() {
  const colors = useColors();
  const { data: priorityLobbies } = trpc.priorityAgenda.list.useQuery();
  if (!priorityLobbies || priorityLobbies.length === 0) return null;
  return (
    <View style={priorityStyles.container}>
      <View style={priorityStyles.header}>
        <Text style={[priorityStyles.title, { color: colors.foreground }]}>⭐ Pautas Prioritárias</Text>
        <Text style={[priorityStyles.subtitle, { color: colors.muted }]}>Aprovadas pela comunidade</Text>
      </View>
      {priorityLobbies.map(lobby => {
        const daysLeft = lobby.priorityAgendaUntil
          ? Math.max(0, Math.ceil((new Date(lobby.priorityAgendaUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 0;
        return (
          <Pressable
            key={lobby.id}
            style={({ pressed }) => [priorityStyles.card, { backgroundColor: "#1E3A8A", opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.push(`/lobby/${lobby.id}` as any)}
          >
            <View style={priorityStyles.cardLeft}>
              <Text style={priorityStyles.cardEmoji}>🏆</Text>
              <View style={{ flex: 1 }}>
                <Text style={priorityStyles.cardTitle} numberOfLines={2}>{lobby.title}</Text>
                <Text style={priorityStyles.cardMeta}>
                  {lobby.supportCount.toLocaleString("pt-BR")} apoios
                  {daysLeft > 0 ? ` • Destaque por mais ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}` : ""}
                </Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={16} color="rgba(255,255,255,0.7)" />
          </Pressable>
        );
      })}
    </View>
  );
}

const priorityStyles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginTop: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12 },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 14, marginBottom: 8 },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  cardEmoji: { fontSize: 22 },
  cardTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", marginBottom: 2, lineHeight: 20 },
  cardMeta: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
});

export default function HomeScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { currentStep, setFilterBarLayout } = useTour();
  const filterBarViewRef = useRef<View>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<LobbyFilters>({});

  const seedMutation = trpc.seed.run.useMutation();

  const activeFilterCount = Object.values(advancedFilters).filter(Boolean).length;

  const { data: lobbies, isLoading: lobbiesLoading, refetch: refetchLobbies } = trpc.lobbies.list.useQuery({
    category: advancedFilters.category ?? (activeFilter === "all" ? undefined : activeFilter),
    petitionCategory: advancedFilters.petitionCategory as "infrastructure" | "education" | "health" | "security" | "environment" | "human_rights" | "economy" | "transparency" | "culture" | undefined,
    state: advancedFilters.state,
    city: advancedFilters.city,
    search: advancedFilters.search || searchQuery || undefined,
    limit: 20,
  });

  const { data: recommendations } = trpc.recommendations.lobbies.useQuery(
    { limit: 5 },
    { enabled: !!user, retry: false }
  );

  const { data: personalizedFeed } = trpc.feed.personalized.useQuery(
    { limit: 10 },
    { enabled: !!user, retry: false }
  );

  const { data: news, isLoading: newsLoading, refetch: refetchNews } = trpc.news.list.useQuery({ limit: 5 });

  const { data: articles } = trpc.constitution.list.useQuery();
  const { data: powerMetrics } = trpc.powerMetrics.get.useQuery();
  const { data: nationalPlebiscites } = trpc.nationalPlebiscites.list.useQuery({ status: "active" });

  // Redirecionar para onboarding se for o primeiro acesso
  useEffect(() => {
    AsyncStorage.getItem("onboarding_completed").then((val) => {
      if (!val) {
        router.replace("/onboarding" as any);
      }
    });
  }, []);

  // Seed data on first load
  useEffect(() => {
    seedMutation.mutate();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchLobbies(), refetchNews()]);
    setRefreshing(false);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const getArticleNumber = (articleId: number) => {
    return articles?.find(a => a.id === articleId)?.articleNumber;
  };

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "national", label: "Nacional" },
    { key: "local", label: "Local" },
  ];

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerTop}>
            {/* Hambúrguer no canto esquerdo */}
            <HamburgerButton color="#FFFFFF" />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.headerTitle}>Populus</Text>
              <Text style={styles.headerSubtitle}>Sua voz na democracia</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 4 }}>
              <Pressable
                onPress={() => router.push("/help-chat" as never)}
                style={({ pressed }) => [styles.notifButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>?</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/news")}
                style={({ pressed }) => [styles.notifButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <IconSymbol name="newspaper.fill" size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Search Bar + Filter Button */}
          <View style={styles.searchRow}>
            <View style={[styles.searchBar, { backgroundColor: "rgba(255,255,255,0.15)", flex: 1 }]}>
              <IconSymbol name="magnifyingglass" size={18} color="rgba(255,255,255,0.8)" />
              <TextInput
                style={[styles.searchInput, { color: "#FFFFFF" }]}
                placeholder="Buscar campanhas..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchInput.length > 0 && (
                <Pressable onPress={() => { setSearchInput(""); setSearchQuery(""); }}>
                  <IconSymbol name="xmark" size={16} color="rgba(255,255,255,0.8)" />
                </Pressable>
              )}
            </View>
            <Pressable
              onPress={() => setShowFilters(true)}
              style={({ pressed }) => [
                styles.filterBtn,
                { backgroundColor: activeFilterCount > 0 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)", opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <IconSymbol name="line.3.horizontal.decrease" size={18} color="#FFFFFF" />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <FilterSheet
          visible={showFilters}
          filters={advancedFilters}
          onApply={(f) => { setAdvancedFilters(f); setActiveFilter("all"); }}
          onClose={() => setShowFilters(false)}
        />

        {/* Active Filters Chips */}
        {activeFilterCount > 0 && (
          <View style={styles.activeFiltersRow}>
            {advancedFilters.category && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}>
                <Text style={[styles.activeFilterChipText, { color: colors.primary }]}>
                  {advancedFilters.category === "national" ? "🏛️ Nacional" : "📍 Local"}
                </Text>
                <Pressable onPress={() => setAdvancedFilters(p => ({ ...p, category: undefined }))}>
                  <IconSymbol name="xmark" size={12} color={colors.primary} />
                </Pressable>
              </View>
            )}
            {advancedFilters.petitionCategory && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}>
                <Text style={[styles.activeFilterChipText, { color: colors.primary }]}>
                  {CATEGORY_ICONS[advancedFilters.petitionCategory]} {advancedFilters.petitionCategory}
                </Text>
                <Pressable onPress={() => setAdvancedFilters(p => ({ ...p, petitionCategory: undefined }))}>
                  <IconSymbol name="xmark" size={12} color={colors.primary} />
                </Pressable>
              </View>
            )}
            {advancedFilters.state && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}>
                <Text style={[styles.activeFilterChipText, { color: colors.primary }]}>📍 {advancedFilters.state}</Text>
                <Pressable onPress={() => setAdvancedFilters(p => ({ ...p, state: undefined, city: undefined }))}>
                  <IconSymbol name="xmark" size={12} color={colors.primary} />
                </Pressable>
              </View>
            )}
            {advancedFilters.city && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}>
                <Text style={[styles.activeFilterChipText, { color: colors.primary }]}>🏙️ {advancedFilters.city}</Text>
                <Pressable onPress={() => setAdvancedFilters(p => ({ ...p, city: undefined }))}>
                  <IconSymbol name="xmark" size={12} color={colors.primary} />
                </Pressable>
              </View>
            )}
            <Pressable onPress={() => setAdvancedFilters({})}>
              <Text style={{ color: colors.muted, fontSize: 12, paddingVertical: 5 }}>Limpar tudo</Text>
            </Pressable>
          </View>
        )}

        {/* Stats Banner */}
        <View style={[styles.statsBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {lobbies?.length ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Lobbys Ativos</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.secondary }]}>
              {lobbies?.reduce((sum, l) => sum + l.supportCount, 0)?.toLocaleString("pt-BR") ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Apoios Totais</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>
              {articles?.length ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Artigos CF</Text>
          </View>
        </View>

        {/* Filter Tabs — medido para o tour spotlight */}
        <View
          ref={filterBarViewRef}
          style={styles.filterContainer}
          onLayout={() => {
            if (currentStep === "explore_filters" && filterBarViewRef.current) {
              filterBarViewRef.current.measure((_x, _y, width, height, pageX, pageY) => {
                setFilterBarLayout({ x: pageX, y: pageY, width, height });
              });
            }
          }}
        >
          {filterTabs.map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveFilter(tab.key)}
              style={[
                styles.filterTab,
                {
                  backgroundColor: activeFilter === tab.key ? colors.primary : colors.surface,
                  borderColor: activeFilter === tab.key ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[
                styles.filterText,
                { color: activeFilter === tab.key ? "#FFFFFF" : colors.muted },
              ]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Populus AI Banner */}
        <Pressable
          onPress={() => router.push("/populus")}
          style={({ pressed }) => [
            styles.populusBanner,
            { backgroundColor: "#1A3A6B", opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <View style={styles.populusBannerLeft}>
            <Text style={styles.populusBannerIcon}>🤖</Text>
            <View>
              <Text style={styles.populusBannerTitle}>Assistente Populus</Text>
              <Text style={styles.populusBannerSubtitle}>IA estratégica para fortalecer sua causa</Text>
            </View>
          </View>
          <IconSymbol name="chevron.right" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>
        {/* Congress Banner */}
        <Pressable
          onPress={() => router.push("/congress")}
          style={({ pressed }) => [
            styles.populusBanner,
            { backgroundColor: "#1B4F72", opacity: pressed ? 0.9 : 1, marginTop: 8 },
          ]}
        >
          <View style={styles.populusBannerLeft}>
            <Text style={styles.populusBannerIcon}>🏛️</Text>
            <View>
              <Text style={styles.populusBannerTitle}>Congresso Nacional</Text>
              <Text style={styles.populusBannerSubtitle}>Projetos, votações e deputados em tempo real</Text>
            </View>
          </View>
          <IconSymbol name="chevron.right" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {/* Plebiscites Banner */}
        <Pressable
          onPress={() => router.push("/plebiscites")}
          style={({ pressed }) => [
            styles.populusBanner,
            { backgroundColor: "#6B21A8", opacity: pressed ? 0.9 : 1, marginTop: 8 },
          ]}
        >
          <View style={styles.populusBannerLeft}>
            <Text style={styles.populusBannerIcon}>🗳️</Text>
            <View>
              <Text style={styles.populusBannerTitle}>Plebiscitos Populares</Text>
              <Text style={styles.populusBannerSubtitle}>
                {nationalPlebiscites && nationalPlebiscites.length > 0
                  ? `${nationalPlebiscites.length} consulta${nationalPlebiscites.length > 1 ? "s" : ""} ativa${nationalPlebiscites.length > 1 ? "s" : ""} — Vote agora`
                  : "Consultas populares — Sua voz conta"}
              </Text>
            </View>
          </View>
          <IconSymbol name="chevron.right" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {/* Poder Popular Panel */}
        {powerMetrics && (
          <View style={[styles.powerPanel, { backgroundColor: "#0F172A", borderColor: "#1E3A8A" }]}>
            <Text style={styles.powerPanelTitle}>⚡ Poder Popular em Tempo Real</Text>
            <View style={styles.powerMetricsGrid}>
              <View style={styles.powerMetricItem}>
                <Text style={[styles.powerMetricNumber, { color: "#60A5FA" }]}>
                  {Number(powerMetrics.totalCitizens).toLocaleString("pt-BR")}
                </Text>
                <Text style={styles.powerMetricLabel}>Cidadãos Ativos</Text>
              </View>
              <View style={styles.powerMetricItem}>
                <Text style={[styles.powerMetricNumber, { color: "#34D399" }]}>
                  {powerMetrics.electoratePercent}%
                </Text>
                <Text style={styles.powerMetricLabel}>do Eleitorado</Text>
              </View>
              <View style={styles.powerMetricItem}>
                <Text style={[styles.powerMetricNumber, { color: "#FBBF24" }]}>
                  {powerMetrics.billsInfluenced}
                </Text>
                <Text style={styles.powerMetricLabel}>Projetos Influenciados</Text>
              </View>
              <View style={styles.powerMetricItem}>
                <Text style={[styles.powerMetricNumber, { color: "#F87171" }]}>
                  {powerMetrics.victories}
                </Text>
                <Text style={styles.powerMetricLabel}>Vitórias Populares</Text>
              </View>
            </View>
          </View>
        )}
        {/* Priority Agenda Section */}
        {/* Rendered only when there are priority lobbies */}
        <PriorityAgendaSection />

        {/* Lobbies Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {searchQuery ? `Resultados para "${searchQuery}"` : "Lobbys em Destaque"}
            </Text>
            <Pressable onPress={() => router.push("/lobbies")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Ver todos</Text>
            </Pressable>
          </View>

          {lobbiesLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : lobbies && lobbies.length > 0 ? (
            lobbies.slice(0, 5).map(lobby => (
              <LobbyCard
                key={lobby.id}
                id={lobby.id}
                title={lobby.title}
                description={lobby.description}
                category={lobby.category}
                status={lobby.status}
                supportCount={lobby.supportCount}
                viewCount={lobby.viewCount}
                locationCity={lobby.locationCity}
                locationState={lobby.locationState}
                articleNumber={getArticleNumber(lobby.constitutionArticleId)}
                onPress={() => router.push(`/lobby/${lobby.id}`)}
              />
            ))
          ) : (
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <IconSymbol name="megaphone.fill" size={40} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {searchQuery ? "Nenhum lobby encontrado" : "Nenhum lobby ainda"}
              </Text>
              <Pressable
                onPress={() => router.push("/create")}
                style={[styles.createBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.createBtnText}>Criar o primeiro lobby</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Recommendations Section */}
        {user && recommendations && recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>✨ Para Você</Text>
              <Text style={[styles.seeAll, { color: colors.muted, fontSize: 12 }]}>Personalizado</Text>
            </View>
            {recommendations.slice(0, 3).map(lobby => (
              <LobbyCard
                key={lobby.id}
                id={lobby.id}
                title={lobby.title}
                description={lobby.description}
                category={lobby.category}
                status={lobby.status}
                supportCount={lobby.supportCount}
                viewCount={lobby.viewCount}
                locationCity={lobby.locationCity}
                locationState={lobby.locationState}
                articleNumber={getArticleNumber(lobby.constitutionArticleId)}
                onPress={() => router.push(`/lobby/${lobby.id}`)}
              />
            ))}
          </View>
        )}

        {/* Personalized Feed Section — atividades de quem o usuário segue */}
        {user && personalizedFeed && personalizedFeed.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🔔 Feed de Conexões</Text>
              <Text style={[styles.seeAll, { color: colors.muted, fontSize: 12 }]}>Quem você segue</Text>
            </View>
            {personalizedFeed.slice(0, 5).map(item => {
              const FEED_ICONS: Record<string, { emoji: string; label: string; color: string }> = {
                lobby_created: { emoji: "📢", label: "criou um lobby", color: "#1A5276" },
                lobby_supported: { emoji: "👍", label: "apoiou um lobby", color: "#1E8449" },
                community_joined: { emoji: "👥", label: "entrou em uma comunidade", color: "#7D3C98" },
                community_created: { emoji: "🏛️", label: "criou uma comunidade", color: "#7D3C98" },
                post_created: { emoji: "📝", label: "publicou no fórum", color: "#1A5276" },
                comment_created: { emoji: "💬", label: "comentou em um post", color: "#117A65" },
              };
              const meta = FEED_ICONS[item.type] ?? { emoji: "📌", label: "teve atividade", color: colors.primary };
              return (
                <View key={item.id} style={[styles.feedItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.feedEmoji, { backgroundColor: meta.color + "18" }]}>
                    <Text style={styles.feedEmojiText}>{meta.emoji}</Text>
                  </View>
                  <View style={styles.feedContent}>
                    <Text style={[styles.feedText, { color: colors.foreground }]}>
                      <Text
                        style={{ fontWeight: "700", color: colors.primary }}
                        onPress={() => router.push(`/user/${item.actorId}`)}
                      >
                        {item.actorName ?? "Usuário"}
                      </Text>
                      {" "}{meta.label}
                    </Text>
                    {item.targetTitle ? (
                      <Text style={[styles.feedTarget, { color: colors.muted }]} numberOfLines={1}>
                        {item.targetTitle}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* News Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Notícias do Congresso</Text>
            <Pressable onPress={() => router.push("/news")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Ver todas</Text>
            </Pressable>
          </View>

          {newsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : news && news.length > 0 ? (
            news.map(item => (
              <NewsCard
                key={item.id}
                title={item.title}
                summary={item.summary}
                source={item.source}
                category={item.category}
                publishedAt={item.publishedAt}
              />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.muted }]}>Sem notícias disponíveis</Text>
          )}
        </View>

        {/* Constitution CTA */}
        <Pressable
          onPress={() => router.push("/constitution")}
          style={({ pressed }) => [
            styles.constitutionCTA,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={styles.ctaContent}>
            <IconSymbol name="building.columns.fill" size={28} color="#FFFFFF" />
            <View style={styles.ctaText}>
              <Text style={styles.ctaTitle}>Base Legal — CF/88</Text>
              <Text style={styles.ctaSubtitle}>Consulte os artigos da Constituição Federal</Text>
            </View>
          </View>
          <IconSymbol name="chevron.right" size={20} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 14,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  statsBanner: {
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
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: "100%",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
  createBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  createBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  constitutionCTA: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  ctaSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  activeFiltersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeFilterChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  recommendSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  feedItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  feedEmoji: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  feedEmojiText: {
    fontSize: 16,
  },
  feedContent: {
    flex: 1,
    gap: 2,
  },
  feedText: {
    fontSize: 13,
    lineHeight: 18,
  },
  feedTarget: {
    fontSize: 12,
    lineHeight: 16,
  },
  populusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  populusBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  populusBannerIcon: {
    fontSize: 28,
  },
  populusBannerTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  populusBannerSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
  powerPanel: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  powerPanelTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 14,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  powerMetricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  powerMetricItem: {
    width: "47%",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: 12,
  },
  powerMetricNumber: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  powerMetricLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
  },
});
