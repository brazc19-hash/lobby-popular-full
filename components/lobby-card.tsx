import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface LobbyCardProps {
  id: number;
  title: string;
  description: string;
  category: "national" | "local";
  status: string;
  supportCount: number;
  viewCount: number;
  locationCity?: string | null;
  locationState?: string | null;
  articleNumber?: string;
  onPress: () => void;
}

export function LobbyCard({
  title,
  description,
  category,
  status,
  supportCount,
  viewCount,
  locationCity,
  locationState,
  articleNumber,
  onPress,
}: LobbyCardProps) {
  const colors = useColors();

  const categoryColor = category === "national" ? colors.primary : colors.secondary;
  const categoryLabel = category === "national" ? "Nacional" : "Local";
  const statusColor =
    status === "active" ? colors.success :
    status === "pending" ? colors.warning :
    status === "rejected" ? colors.error : colors.muted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + "18" }]}>
          <IconSymbol
            name={category === "national" ? "building.columns.fill" : "mappin"}
            size={12}
            color={categoryColor}
          />
          <Text style={[styles.categoryText, { color: categoryColor }]}>{categoryLabel}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
        {title}
      </Text>

      {/* Description */}
      <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>
        {description}
      </Text>

      {/* Legal Badge */}
      {articleNumber && (
        <View style={[styles.legalBadge, { backgroundColor: colors.accent + "15", borderColor: colors.accent + "40" }]}>
          <IconSymbol name="scale.3d" size={12} color={colors.accent} />
          <Text style={[styles.legalText, { color: colors.accent }]}>{articleNumber} — CF/88</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.stat}>
          <IconSymbol name="hand.thumbsup.fill" size={14} color={colors.secondary} />
          <Text style={[styles.statText, { color: colors.muted }]}>
            {supportCount >= 1000 ? `${(supportCount / 1000).toFixed(1)}k` : supportCount} apoios
          </Text>
        </View>
        <View style={styles.stat}>
          <IconSymbol name="eye.fill" size={14} color={colors.muted} />
          <Text style={[styles.statText, { color: colors.muted }]}>
            {viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount}
          </Text>
        </View>
        {locationCity && (
          <View style={styles.stat}>
            <IconSymbol name="location.fill" size={14} color={colors.muted} />
            <Text style={[styles.statText, { color: colors.muted }]}>
              {locationCity}{locationState ? `, ${locationState}` : ""}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  legalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  legalText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
  },
});
