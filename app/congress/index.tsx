import { useRef, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, Pressable,
  FlatList, ActivityIndicator, Linking, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { useTour } from "@/contexts/tour-context";
import { ContextualTip } from "@/components/ui/contextual-tip";

type Tab = "bills" | "votes" | "deputies" | "committees" | "fronts";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "bills", label: "Projetos", icon: "doc.text.fill" },
  { id: "votes", label: "Votações", icon: "checkmark.seal.fill" },
  { id: "deputies", label: "Deputados", icon: "person.2.fill" },
  { id: "committees", label: "Comissões", icon: "building.2.fill" },
  { id: "fronts", label: "Frentes", icon: "flag.fill" },
];

const URGENCY_COLORS: Record<string, string> = {
  urgentissima: "#C0392B",
  urgente: "#E67E22",
  normal: "#27AE60",
};

const URGENCY_LABELS: Record<string, string> = {
  urgentissima: "URGENTÍSSIMA",
  urgente: "URGENTE",
  normal: "Normal",
};

const HOUSE_COLORS: Record<string, string> = {
  camara: "#1B4F72",
  senado: "#6C3483",
};

const HOUSE_LABELS: Record<string, string> = {
  camara: "Câmara",
  senado: "Senado",
};

export default function CongressScreen() {
  const colors = useColors();
  const router = useRouter();
  const goBack = useSmartBack("/(tabs)");
  const { currentStep, setLegislativeLayout } = useTour();
  const legislativeTabsRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState<Tab>("bills");
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("saúde");
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);

  const billsQuery = trpc.congress.searchBills.useQuery(
    { keyword: submittedQuery },
    { enabled: activeTab === "bills" }
  );

  const votesQuery = trpc.congress.upcomingVotes.useQuery(
    undefined,
    { enabled: activeTab === "votes" }
  );

  const deputiesQuery = trpc.congress.deputies.useQuery(
    selectedState ? { state: selectedState } : undefined,
    { enabled: activeTab === "deputies" }
  );

  const committeesQuery = trpc.congress.committees.useQuery(
    undefined,
    { enabled: activeTab === "committees" }
  );

  const frontsQuery = trpc.congress.fronts.useQuery(
    undefined,
    { enabled: activeTab === "fronts" }
  );

  const handleSearch = useCallback(() => {
    if (searchQuery.trim().length >= 2) {
      setSubmittedQuery(searchQuery.trim());
    }
  }, [searchQuery]);

  const renderBills = () => {
    if (billsQuery.isLoading) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;
    const bills = billsQuery.data ?? [];
    return (
      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.muted }]}>Nenhum projeto encontrado.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => Linking.openURL(item.url)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.houseBadge, { backgroundColor: HOUSE_COLORS[item.house] }]}>
                <Text style={styles.houseBadgeText}>{HOUSE_LABELS[item.house]}</Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
                  {item.type} {item.number}/{item.year}
                </Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={3}>
              {item.title}
            </Text>
            <Text style={[styles.cardMeta, { color: colors.muted }]}>
              Autor: {item.author}
            </Text>
            {item.status && (
              <Text style={[styles.cardStatus, { color: colors.muted }]} numberOfLines={2}>
                {item.status}
              </Text>
            )}
            {item.committee && (
              <View style={[styles.committeePill, { backgroundColor: colors.border }]}>
                <Text style={[styles.committeePillText, { color: colors.muted }]}>📋 {item.committee}</Text>
              </View>
            )}
            <View style={styles.cardFooter}>
              <Text style={[styles.cardDate, { color: colors.muted }]}>
                {item.lastUpdate ? `Atualizado: ${new Date(item.lastUpdate).toLocaleDateString("pt-BR")}` : ""}
              </Text>
              <View style={styles.externalLink}>
                <IconSymbol name="chevron.right" size={14} color={colors.primary} />
                <Text style={[styles.externalLinkText, { color: colors.primary }]}>Ver no site</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    );
  };

  const renderVotes = () => {
    if (votesQuery.isLoading) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;
    const votes = votesQuery.data ?? [];
    return (
      <FlatList
        data={votes}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.muted }]}>Nenhuma votação próxima encontrada.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.houseBadge, { backgroundColor: HOUSE_COLORS[item.house] }]}>
                <Text style={styles.houseBadgeText}>{HOUSE_LABELS[item.house]}</Text>
              </View>
              <View style={[styles.urgencyBadge, { backgroundColor: URGENCY_COLORS[item.urgency] + "20" }]}>
                <Text style={[styles.urgencyText, { color: URGENCY_COLORS[item.urgency] }]}>
                  {URGENCY_LABELS[item.urgency]}
                </Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={3}>
              {item.title}
            </Text>
            <Text style={[styles.cardMeta, { color: colors.muted }]} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.voteDetails}>
              <View style={styles.voteDetail}>
                <IconSymbol name="calendar" size={14} color={colors.primary} />
                <Text style={[styles.voteDetailText, { color: colors.foreground }]}>
                  {item.date ? new Date(item.date).toLocaleDateString("pt-BR") : "Data a definir"}
                  {item.time ? ` às ${item.time}` : ""}
                </Text>
              </View>
              {item.committee && (
                <View style={styles.voteDetail}>
                  <IconSymbol name="building.2.fill" size={14} color={colors.primary} />
                  <Text style={[styles.voteDetailText, { color: colors.foreground }]}>{item.committee}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      />
    );
  };

  const renderDeputies = () => {
    if (deputiesQuery.isLoading) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;
    const deputies = deputiesQuery.data ?? [];

    const STATES = ["SP", "RJ", "MG", "RS", "BA", "PR", "PE", "CE", "GO", "SC"];

    return (
      <>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stateFilter}>
          <TouchableOpacity
            style={[styles.stateChip, !selectedState && { backgroundColor: colors.primary }]}
            onPress={() => setSelectedState(undefined)}
          >
            <Text style={[styles.stateChipText, !selectedState && { color: "#fff" }]}>Todos</Text>
          </TouchableOpacity>
          {STATES.map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.stateChip, selectedState === st && { backgroundColor: colors.primary }]}
              onPress={() => setSelectedState(selectedState === st ? undefined : st)}
            >
              <Text style={[styles.stateChipText, selectedState === st && { color: "#fff" }]}>{st}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <FlatList
          data={deputies}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.muted }]}>Nenhum deputado encontrado.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.deputyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/congress/deputy/[id]", params: { id: item.id, name: item.name, party: item.party, state: item.state } })}
              activeOpacity={0.7}
            >
              <View style={[styles.deputyAvatar, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.deputyAvatarText, { color: colors.primary }]}>
                  {item.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                </Text>
              </View>
              <View style={styles.deputyInfo}>
                <Text style={[styles.deputyName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.deputyMeta, { color: colors.muted }]}>{item.party} — {item.state}</Text>
                {item.committees.length > 0 && (
                  <Text style={[styles.deputyCommittees, { color: colors.muted }]} numberOfLines={1}>
                    {item.committees.slice(0, 2).join(", ")}
                  </Text>
                )}
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>
          )}
        />
      </>
    );
  };

  const renderCommittees = () => {
    if (committeesQuery.isLoading) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;
    const committees = committeesQuery.data ?? [];
    return (
      <FlatList
        data={committees}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.muted }]}>Nenhuma comissão encontrada.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.typeBadge, { backgroundColor: "#1B4F72" + "20" }]}>
                <Text style={[styles.typeBadgeText, { color: "#1B4F72" }]}>{item.acronym}</Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.name}</Text>
            {item.members.length > 0 && (
              <View style={styles.membersList}>
                {item.members.map((member, idx) => (
                  <View key={idx} style={[styles.memberItem, { borderColor: colors.border }]}>
                    <View style={[styles.memberAvatar, { backgroundColor: colors.primary + "15" }]}>
                      <Text style={[styles.memberAvatarText, { color: colors.primary }]}>
                        {member.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, { color: colors.foreground }]} numberOfLines={1}>{member.name}</Text>
                      <Text style={[styles.memberMeta, { color: colors.muted }]}>{member.party} — {member.state} · {member.role}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      />
    );
  };

  const renderFronts = () => {
    if (frontsQuery.isLoading) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;
    const fronts = frontsQuery.data ?? [];
    return (
      <FlatList
        data={fronts}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.muted }]}>Nenhuma frente parlamentar encontrada.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.typeBadge, { backgroundColor: "#6C3483" + "20" }]}>
                <Text style={[styles.typeBadgeText, { color: "#6C3483" }]}>{item.theme}</Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
            <View style={styles.frontStats}>
              <View style={styles.frontStat}>
                <IconSymbol name="person.2.fill" size={14} color={colors.primary} />
                <Text style={[styles.frontStatText, { color: colors.foreground }]}>
                  {item.memberCount} membros
                </Text>
              </View>
              <View style={styles.frontStat}>
                <IconSymbol name="person.fill" size={14} color={colors.muted} />
                <Text style={[styles.frontStatText, { color: colors.muted }]}>
                  Coord: {item.coordinator}
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "bills": return renderBills();
      case "votes": return renderVotes();
      case "deputies": return renderDeputies();
      case "committees": return renderCommittees();
      case "fronts": return renderFronts();
    }
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1B4F72" }]}>
        <BackButton
          onPress={goBack}
          variant="dark"
          label="Voltar"
        />
        
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>🏗️ Congresso Nacional</Text>
            <Text style={styles.headerSubtitle}>Dados legislativos em tempo real</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={[styles.alertsBtn, { backgroundColor: "#E74C3C" }]}
              onPress={() => router.push("/congress/live" as any)}
            >
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 0.5 }}>AO VIVO</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.alertsBtn}
              onPress={() => router.push("/congress/alerts")}
            >
              <IconSymbol name="bell.fill" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar (only for bills tab) */}
        {activeTab === "bills" && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar projetos de lei..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <IconSymbol name="magnifyingglass" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tabs — medido para o tour spotlight */}
      <ScrollView
        ref={legislativeTabsRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        onLayout={() => {
          if (currentStep === "legislative_tracking" && legislativeTabsRef.current) {
            (legislativeTabsRef.current as any).measure((_x: number, _y: number, width: number, height: number, pageX: number, pageY: number) => {
              setLegislativeLayout({ x: pageX, y: pageY, width, height });
            });
          }
        }}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && { borderBottomColor: "#1B4F72", borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab.id ? "#1B4F72" : colors.muted }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Contextual Tip — shown once on first visit */}
      <ContextualTip
        tipKey="congress_first_visit"
        emoji="🏛️"
        title="Dados direto do Congresso Nacional"
        body="Todos os projetos, votações e deputados são atualizados em tempo real via API oficial da Câmara e do Senado. Toque em qualquer item para ver detalhes e pressionar parlamentares."
      />
      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {renderContent()}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingTop: 8 },
  backBtnCongress: { alignSelf: "flex-start", paddingVertical: 4, marginBottom: 6 },
  backBtnCongressText: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600" },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  alertsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  searchContainer: { flexDirection: "row", gap: 8 },
  searchInput: { flex: 1, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: "#fff", fontSize: 14 },
  searchBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  tabBar: { borderBottomWidth: 1, maxHeight: 48 },
  tab: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { fontSize: 13, fontWeight: "600" },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 40 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 14 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: "row", gap: 8, marginBottom: 8 },
  houseBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  houseBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  urgencyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  urgencyText: { fontSize: 11, fontWeight: "700" },
  cardTitle: { fontSize: 14, fontWeight: "600", lineHeight: 20, marginBottom: 6 },
  cardMeta: { fontSize: 12, marginBottom: 4 },
  cardStatus: { fontSize: 12, marginBottom: 6 },
  committeePill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
  committeePillText: { fontSize: 11 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  cardDate: { fontSize: 11 },
  externalLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  externalLinkText: { fontSize: 12, fontWeight: "600" },
  voteDetails: { gap: 6, marginTop: 8 },
  voteDetail: { flexDirection: "row", alignItems: "center", gap: 6 },
  voteDetailText: { fontSize: 13 },
  stateFilter: { marginBottom: 12, maxHeight: 44 },
  stateChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#E8EDF2", marginRight: 8 },
  stateChipText: { fontSize: 13, fontWeight: "600", color: "#1B4F72" },
  deputyCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10, gap: 12 },
  deputyAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  deputyAvatarText: { fontSize: 16, fontWeight: "700" },
  deputyInfo: { flex: 1 },
  deputyName: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  deputyMeta: { fontSize: 12, marginBottom: 2 },
  deputyCommittees: { fontSize: 11 },
  membersList: { marginTop: 10, gap: 8 },
  memberItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 8, borderTopWidth: 1 },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  memberAvatarText: { fontSize: 13, fontWeight: "700" },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 13, fontWeight: "600" },
  memberMeta: { fontSize: 11, marginTop: 1 },
  frontStats: { flexDirection: "row", gap: 16, marginTop: 8 },
  frontStat: { flexDirection: "row", alignItems: "center", gap: 6 },
  frontStatText: { fontSize: 13 },
});
