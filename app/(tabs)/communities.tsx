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
import { ScreenContainer } from "@/components/screen-container";
import { CommunityCard } from "@/components/community-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { ScrollView } from "react-native";

export default function CommunitiesScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTheme, setActiveTheme] = useState<string | undefined>(undefined);

  const { data: communities, isLoading } = trpc.communities.list.useQuery(
    searchQuery ? { search: searchQuery } : undefined
  );

  const { data: recommendedCommunities } = trpc.recommendations.communities.useQuery(
    { limit: 3 },
    { enabled: !!user, retry: false }
  );

  const handleSearch = () => setSearchQuery(searchInput);

  const THEMES = [
    { value: undefined, label: "Todas" },
    { value: "infrastructure", label: "🏗️ Infraestrutura" },
    { value: "education", label: "📚 Educação" },
    { value: "health", label: "🏥 Saúde" },
    { value: "security", label: "🛡️ Segurança" },
    { value: "environment", label: "🌿 Meio Ambiente" },
    { value: "economy", label: "💰 Economia" },
    { value: "transparency", label: "👁️ Transparência" },
  ];

  const filteredCommunities = activeTheme
    ? communities?.filter(c => c.theme === activeTheme)
    : communities;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Comunidades</Text>
          <Pressable
            onPress={() => router.push("/community/create")}
            style={({ pressed }) => [styles.createBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <IconSymbol name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
        <Text style={styles.headerSubtitle}>
          Junte-se a grupos e fortaleça lobbys
        </Text>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <IconSymbol name="magnifyingglass" size={18} color="rgba(255,255,255,0.8)" />
          <TextInput
            style={[styles.searchInput, { color: "#FFFFFF" }]}
            placeholder="Buscar comunidades..."
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
      </View>

      {/* Theme Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 52 }}
        contentContainerStyle={styles.themeScroll}
      >
        {THEMES.map(t => {
          const active = activeTheme === t.value;
          return (
            <Pressable
              key={String(t.value)}
              onPress={() => setActiveTheme(t.value)}
              style={[
                styles.themeChip,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.themeChipText, { color: active ? "#fff" : colors.foreground }]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredCommunities ?? []}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <CommunityCard
              id={item.id}
              name={item.name}
              description={item.description}
              theme={item.theme}
              memberCount={item.memberCount}
              onPress={() => router.push(`/community/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Recommended Communities */}
              {user && recommendedCommunities && recommendedCommunities.length > 0 && !searchQuery && !activeTheme && (
                <View style={styles.recommendSection}>
                  <Text style={[styles.recommendTitle, { color: colors.foreground }]}>✨ Sugeridas para Você</Text>
                  {recommendedCommunities.map(item => (
                    <CommunityCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      description={item.description}
                      theme={item.theme}
                      memberCount={item.memberCount}
                      onPress={() => router.push(`/community/${item.id}`)}
                    />
                  ))}
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <Text style={[styles.allCommunitiesLabel, { color: colors.muted }]}>Todas as Comunidades</Text>
                </View>
              )}
              {(filteredCommunities?.length ?? 0) > 0 && (
                <Text style={[styles.listHeader, { color: colors.muted }]}>
                  {filteredCommunities?.length} comunidade{(filteredCommunities?.length ?? 0) !== 1 ? "s" : ""}
                </Text>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol name="person.3.fill" size={60} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {searchQuery ? "Nenhuma comunidade encontrada" : "Sem comunidades ainda"}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                {searchQuery
                  ? "Tente buscar por outro termo"
                  : "Crie a primeira comunidade e reúna pessoas com os mesmos objetivos"}
              </Text>
              {!searchQuery && (
                <Pressable
                  onPress={() => router.push("/community/create")}
                  style={[styles.createCommunityBtn, { backgroundColor: colors.primary }]}
                >
                  <IconSymbol name="plus" size={18} color="#FFFFFF" />
                  <Text style={styles.createCommunityBtnText}>Criar Comunidade</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 8,
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
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
  },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
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
    marginTop: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listHeader: {
    fontSize: 13,
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  createCommunityBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  createCommunityBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  themeScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  themeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 6,
  },
  themeChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  recommendSection: {
    marginBottom: 8,
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  allCommunitiesLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
});
