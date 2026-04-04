import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { ScreenContainer } from "@/components/screen-container";
import { NewsCard } from "@/components/news-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function NewsScreen() {
  const colors = useColors();
  const goBack = useSmartBack("/(tabs)");
  const { data: news, isLoading, refetch } = trpc.news.list.useQuery({ limit: 50 });

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <BackButton
          onPress={goBack}
          variant="dark"
          label="Voltar"
        />
        <View>
          <Text style={styles.headerTitle}>Notícias</Text>
          <Text style={styles.headerSubtitle}>Congresso e Democracia</Text>
        </View>
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
        <IconSymbol name="newspaper.fill" size={16} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.muted }]}>
          Notícias simuladas sobre o Congresso Nacional, projetos de lei e participação cidadã.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={news}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <NewsCard
              title={item.title}
              summary={item.summary}
              source={item.source}
              category={item.category}
              publishedAt={item.publishedAt}
            />
          )}
          ListEmptyComponent={
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <IconSymbol name="newspaper.fill" size={40} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                Nenhuma notícia disponível
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
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
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
