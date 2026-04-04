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
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const THEME_ICONS: Record<string, "building.columns.fill" | "heart.fill" | "person.fill" | "globe" | "shield.fill" | "scale.3d" | "doc.text.fill" | "location.fill" | "chart.bar.fill"> = {
  "Direitos Fundamentais": "shield.fill",
  "Direitos Sociais": "heart.fill",
  "Administração Pública": "building.columns.fill",
  "Saúde": "heart.fill",
  "Educação": "doc.text.fill",
  "Meio Ambiente": "globe",
  "Urbanismo": "location.fill",
  "Segurança": "shield.fill",
  "Economia": "chart.bar.fill",
  "Participação Política": "person.fill",
};

export default function ConstitutionScreen() {
  const colors = useColors();
  const goBack = useSmartBack("/(tabs)");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: articles, isLoading } = trpc.constitution.list.useQuery(
    searchQuery ? { search: searchQuery } : undefined
  );

  const handleSearch = () => setSearchQuery(searchInput);

  const themes = articles ? [...new Set(articles.map(a => a.theme))] : [];

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          <BackButton
            onPress={goBack}
            variant="dark"
            label="Voltar"
          />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Base Legal</Text>
            <Text style={styles.headerSubtitle}>Constituição Federal de 1988</Text>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <IconSymbol name="magnifyingglass" size={18} color="rgba(255,255,255,0.8)" />
          <TextInput
            style={[styles.searchInput, { color: "#FFFFFF" }]}
            placeholder="Buscar artigo ou tema..."
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

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.accent + "12", borderColor: colors.accent + "30" }]}>
        <IconSymbol name="info.circle" size={16} color={colors.accent} />
        <Text style={[styles.infoText, { color: colors.muted }]}>
          Todo lobby deve ser fundamentado em um artigo da Constituição Federal para garantir sua legalidade.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isExpanded = expandedId === item.id;
            const iconName = THEME_ICONS[item.theme] ?? "doc.text.fill";

            return (
              <Pressable
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
                style={({ pressed }) => [
                  styles.articleCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isExpanded ? colors.primary + "60" : colors.border,
                    opacity: pressed ? 0.95 : 1,
                  },
                ]}
              >
                {/* Article Header */}
                <View style={styles.articleHeader}>
                  <View style={[styles.articleIcon, { backgroundColor: colors.primary + "15" }]}>
                    <IconSymbol name={iconName} size={18} color={colors.primary} />
                  </View>
                  <View style={styles.articleHeaderText}>
                    <Text style={[styles.articleNumber, { color: colors.primary }]}>
                      {item.articleNumber}
                    </Text>
                    <Text style={[styles.articleTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                  <View style={[styles.themeBadge, { backgroundColor: colors.primary + "10" }]}>
                    <Text style={[styles.themeText, { color: colors.primary }]}>{item.theme}</Text>
                  </View>
                  <IconSymbol
                    name={isExpanded ? "arrow.up.circle.fill" : "arrow.down.circle.fill"}
                    size={20}
                    color={colors.muted}
                  />
                </View>

                {/* Summary */}
                <Text style={[styles.articleSummary, { color: colors.muted }]} numberOfLines={isExpanded ? undefined : 2}>
                  {item.summary}
                </Text>

                {/* Full Text (expanded) */}
                {isExpanded && (
                  <View style={[styles.fullTextContainer, { borderColor: colors.border }]}>
                    <Text style={[styles.fullTextLabel, { color: colors.muted }]}>TEXTO COMPLETO</Text>
                    <Text style={[styles.fullText, { color: colors.foreground }]}>
                      {item.fullText}
                    </Text>
                  </View>
                )}

                {/* Use in Lobby Button */}
                {isExpanded && (
                  <Pressable
                    onPress={() => router.push({ pathname: "/create", params: { articleId: item.id } })}
                    style={[styles.useInLobbyBtn, { backgroundColor: colors.secondary }]}
                  >
                    <IconSymbol name="megaphone.fill" size={16} color="#FFFFFF" />
                    <Text style={styles.useInLobbyBtnText}>Usar em um Lobby</Text>
                  </Pressable>
                )}
              </Pressable>
            );
          }}
          ListHeaderComponent={
            articles && articles.length > 0 ? (
              <Text style={[styles.listHeader, { color: colors.muted }]}>
                {articles.length} artigo{articles.length !== 1 ? "s" : ""} encontrado{articles.length !== 1 ? "s" : ""}
                {searchQuery ? ` para "${searchQuery}"` : ""}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <IconSymbol name="building.columns.fill" size={40} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {searchQuery ? "Nenhum artigo encontrado" : "Carregando artigos..."}
              </Text>
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
    gap: 14,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
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
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
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
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    margin: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  listHeader: {
    fontSize: 13,
    marginBottom: 12,
  },
  articleCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 10,
  },
  articleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  articleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  articleHeaderText: {
    flex: 1,
  },
  articleNumber: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 1,
  },
  themeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  themeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  articleSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  fullTextContainer: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  fullTextLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  fullText: {
    fontSize: 13,
    lineHeight: 21,
  },
  useInLobbyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  useInLobbyBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
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
});
