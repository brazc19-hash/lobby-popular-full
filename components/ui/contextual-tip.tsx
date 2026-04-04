import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface ContextualTipProps {
  /** Unique key to store "seen" state in AsyncStorage */
  tipKey: string;
  /** Emoji icon for the tip */
  emoji: string;
  /** Short title */
  title: string;
  /** Tip body text */
  body: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Optional action callback */
  onAction?: () => void;
}

const TIP_PREFIX = "@populus:tip:";

/**
 * A contextual tip banner that shows once per screen.
 * After the user dismisses it, it never shows again.
 * Use this for first-visit hints on key screens.
 */
export function ContextualTip({
  tipKey,
  emoji,
  title,
  body,
  actionLabel,
  onAction,
}: ContextualTipProps) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const storageKey = `${TIP_PREFIX}${tipKey}`;
    AsyncStorage.getItem(storageKey).then((val) => {
      if (!val) {
        setVisible(true);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [tipKey, opacity]);

  const dismiss = async () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setVisible(false));
    await AsyncStorage.setItem(`${TIP_PREFIX}${tipKey}`, "seen");
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.highlight,
          borderColor: colors.primary + "40",
          opacity,
        },
      ]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
        <Text style={[styles.body, { color: colors.foreground }]}>{body}</Text>
        {actionLabel && onAction && (
          <Pressable
            onPress={() => { onAction(); dismiss(); }}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        )}
      </View>
      <Pressable
        onPress={dismiss}
        style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.6 : 1 }]}
        hitSlop={8}
      >
        <IconSymbol name="xmark" size={14} color={colors.muted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  emoji: { fontSize: 22, marginTop: 1 },
  content: { flex: 1, gap: 4 },
  title: { fontSize: 13, fontWeight: "700" },
  body: { fontSize: 12, lineHeight: 18 },
  actionBtn: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },
  closeBtn: { padding: 2, marginTop: 2 },
});
