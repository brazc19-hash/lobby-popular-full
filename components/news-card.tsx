import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface NewsCardProps {
  title: string;
  summary: string;
  source: string;
  category?: string | null;
  publishedAt: Date | string;
  onPress?: () => void;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function NewsCard({ title, summary, source, category, publishedAt, onPress }: NewsCardProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      {/* Category */}
      {category && (
        <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]}>{category}</Text>
        </View>
      )}

      {/* Title */}
      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={3}>
        {title}
      </Text>

      {/* Summary */}
      <Text style={[styles.summary, { color: colors.muted }]} numberOfLines={2}>
        {summary}
      </Text>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.source}>
          <IconSymbol name="newspaper.fill" size={13} color={colors.muted} />
          <Text style={[styles.sourceText, { color: colors.muted }]}>{source}</Text>
        </View>
        <View style={styles.date}>
          <IconSymbol name="clock" size={13} color={colors.muted} />
          <Text style={[styles.dateText, { color: colors.muted }]}>{formatDate(publishedAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    marginBottom: 6,
  },
  summary: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  source: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: "500",
  },
  date: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 12,
  },
});
