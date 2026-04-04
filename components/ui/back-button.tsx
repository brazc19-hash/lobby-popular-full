import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";

export interface BackButtonProps {
  /** Texto exibido ao lado do ícone. Padrão: "Voltar" */
  label?: string;
  /** Callback de pressão. Se omitido, usa router.back() */
  onPress?: () => void;
  /** Cor de fundo do header — define se o botão fica claro ou escuro */
  variant?: "light" | "dark" | "auto";
  /** Estilo extra para o container externo */
  style?: object;
}

/**
 * Botão de navegação "← Voltar" padronizado conforme design spec:
 * - Área de toque mínima: 44×44px
 * - Padding: 16px das bordas
 * - Ícone chevron + texto opcional
 * - Cores: azul-marinho (#1E3A5F) no tema claro, branco (#FFFFFF) no escuro
 * - Efeito press: fundo com opacidade 10% e borda arredondada
 */
export function BackButton({ label = "Voltar", onPress, variant = "auto", style }: BackButtonProps) {
  const handlePress = onPress ?? (() => router.back());
  const colors = useColors();
  const scheme = useColorScheme();

  // Determinar cor do texto/ícone
  let textColor: string;
  if (variant === "dark") {
    // Botão sobre fundo escuro/colorido → texto branco
    textColor = "#FFFFFF";
  } else if (variant === "light") {
    // Botão sobre fundo claro → azul-marinho
    textColor = "#1E3A5F";
  } else {
    // Auto: segue o tema do sistema
    textColor = scheme === "dark" ? "#FFFFFF" : "#1E3A5F";
  }

  const pressedBg = variant === "dark"
    ? "rgba(255,255,255,0.10)"
    : scheme === "dark"
      ? "rgba(255,255,255,0.10)"
      : "rgba(30,58,95,0.08)";

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.btn,
        pressed && { backgroundColor: pressedBg },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {/* Chevron left — desenhado com dois segmentos de linha */}
      <View style={styles.chevronWrapper}>
        <View style={[styles.chevronTop, { backgroundColor: textColor }]} />
        <View style={[styles.chevronBottom, { backgroundColor: textColor }]} />
      </View>
      {label ? (
        <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  chevronWrapper: {
    width: 10,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  // Two bars forming a "<" chevron
  chevronTop: {
    position: "absolute",
    width: 2,
    height: 11,
    borderRadius: 1,
    top: 0,
    left: 4,
    transform: [{ rotate: "-45deg" }, { translateY: 2 }],
  },
  chevronBottom: {
    position: "absolute",
    width: 2,
    height: 11,
    borderRadius: 1,
    bottom: 0,
    left: 4,
    transform: [{ rotate: "45deg" }, { translateY: -2 }],
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
});
