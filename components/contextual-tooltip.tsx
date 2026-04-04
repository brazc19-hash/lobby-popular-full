import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/use-colors";

interface ContextualTooltipProps {
  /** Chave única para persistência no AsyncStorage */
  id: string;
  /** Texto do tooltip */
  message: string;
  /** Ícone opcional */
  icon?: string;
  /** Posição do tooltip em relação ao elemento */
  position?: "top" | "bottom";
  /** Cor de destaque (padrão: azul-marinho do Populus) */
  accentColor?: string;
  /** Callback ao fechar */
  onDismiss?: () => void;
}

const TOOLTIP_PREFIX = "@populus_tooltip_seen_";

export function ContextualTooltip({
  id,
  message,
  icon = "💡",
  position = "bottom",
  accentColor = "#1E3A5F",
  onDismiss,
}: ContextualTooltipProps) {
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(position === "bottom" ? -8 : 8)).current;
  const colors = useColors();

  useEffect(() => {
    AsyncStorage.getItem(`${TOOLTIP_PREFIX}${id}`).then((val) => {
      if (val !== "true") {
        setVisible(true);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]).start();
      }
    });
  }, [id]);

  const handleDismiss = async () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: position === "bottom" ? -8 : 8, duration: 200, useNativeDriver: true }),
    ]).start(async () => {
      setVisible(false);
      await AsyncStorage.setItem(`${TOOLTIP_PREFIX}${id}`, "true");
      onDismiss?.();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY }] },
        position === "top" && styles.containerTop,
      ]}
    >
      {/* Seta indicativa */}
      {position === "bottom" && (
        <View style={[styles.arrowUp, { borderBottomColor: accentColor }]} />
      )}

      <View style={[styles.bubble, { backgroundColor: accentColor }]}>
        <View style={styles.content}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <Pressable
          onPress={handleDismiss}
          style={({ pressed }) => [styles.dismissBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.dismissText}>Entendi ✓</Text>
        </Pressable>
      </View>

      {position === "top" && (
        <View style={[styles.arrowDown, { borderTopColor: accentColor }]} />
      )}
    </Animated.View>
  );
}

/**
 * Hook para verificar se um tooltip já foi visto.
 * Útil para lógica condicional fora do componente.
 */
export function useTooltipSeen(id: string) {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(`${TOOLTIP_PREFIX}${id}`).then((val) => {
      setSeen(val === "true");
    });
  }, [id]);

  const markSeen = async () => {
    await AsyncStorage.setItem(`${TOOLTIP_PREFIX}${id}`, "true");
    setSeen(true);
  };

  return { seen, markSeen };
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 999,
  },
  containerTop: {
    bottom: "100%",
    marginBottom: 8,
  },
  arrowUp: {
    alignSelf: "flex-start",
    marginLeft: 24,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  arrowDown: {
    alignSelf: "flex-start",
    marginLeft: 24,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  bubble: {
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  icon: {
    fontSize: 20,
    lineHeight: 24,
  },
  message: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  dismissBtn: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  dismissText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
