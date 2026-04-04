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
import { router } from "expo-router";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { ScreenContainer } from "@/components/screen-container";
import { LobbyCard } from "@/components/lobby-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type FilterTab = "all" | "national" | "local";

export default function LobbiesScreen() {
  const colors = useColors();
  const goBack = useSmartBack("/(tabs)");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: lobbies, isLoading } = trpc.lobbies.list.useQuery({
    category: activeFilter === "all" ? undefined : activeFilter,
    search: searchQuery || undefined,
  });

  const { data: articles } = trpc.constitution.list.useQuery();

  const getArticleNumber = (articleId: number) =>
    articles?.find(a => a.id === articleId)?.articleNumber;

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "national", label: "Nacional" },
    { key: "local", label: "Local" },
  ];

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <BackButton
          onPress={goBack}
          variant="dark"
          label="Voltar"
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Todos os Lobbys</Text>
          <Text style={styles.headerSubtitle}>
            {lobbies?.length ?? 0} lobbys encontrados
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/create")}
          style={({ pressed }) => [styles.createBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <IconSymbol name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Buscar lobbys..."
          placeholderTextColor={colors.muted}
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={() => setSearchQuery(searchInput)}
          returnKeyType="search"
        />
        {searchInput.length > 0 && (
          <Pressable onPress={() => { setSearchInput(""); setSearchQuery(""); }}>
            <IconSymbol name="xmark" size={16} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
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

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lobbies}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <LobbyCard
              id={item.id}
              title={item.title}
              description={item.description}
              category={item.category}
              status={item.status}
              supportCount={item.supportCount}
              viewCount={item.viewCount}
              locationCity={item.locationCity}
              locationState={item.locationState}
              articleNumber={getArticleNumber(item.constitutionArticleId)}
              onPress={() => router.push(`/lobby/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <IconSymbol name="megaphone.fill" size={40} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {searchQuery ? "Nenhum lobby encontrado" : "Nenhum lobby ainda"}
              </Text>
              <Pressable
                onPress={() => router.push("/create")}
                style={[styles.createLobbyBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.createLobbyBtnText}>Criar Campanha</Text>
              </Pressable>
            </View>
          }
        />
      )}
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
    marginTop: 2,
  },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 12,
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 32,
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
  createLobbyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  createLobbyBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
