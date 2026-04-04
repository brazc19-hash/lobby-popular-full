import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface CommunityCardProps {
  id: number;
  name: string;
  description: string;
  theme: string;
  memberCount: number;
  onPress: () => void;
}

const THEME_COLORS: Record<string, string> = {
  "Administração Pública": "#1A3A6B",
  "Saúde": "#1B7A4A",
  "Urbanismo": "#7B3FA0",
  "Educação": "#C05621",
  "Meio Ambiente": "#2D6A4F",
  "Segurança": "#C0392B",
  "Economia": "#1A5276",
  "Participação Política": "#6C3483",
};

export function CommunityCard({ name, description, theme, memberCount, onPress }: CommunityCardProps) {
  const colors = useColors();
  const themeColor = THEME_COLORS[theme] ?? colors.primary;
  const initial = name.charAt(0).toUpperCase();

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
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: themeColor }]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {name}
        </Text>
        <View style={[styles.themeBadge, { backgroundColor: themeColor + "15" }]}>
          <Text style={[styles.themeText, { color: themeColor }]}>{theme}</Text>
        </View>
        <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>
          {description}
        </Text>
        <View style={styles.footer}>
          <IconSymbol name="person.3.fill" size={14} color={colors.muted} />
          <Text style={[styles.memberText, { color: colors.muted }]}>
            {memberCount >= 1000 ? `${(memberCount / 1000).toFixed(1)}k` : memberCount} membros
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
  },
  themeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  themeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  memberText: {
    fontSize: 13,
  },
});
