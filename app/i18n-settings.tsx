import React from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useColors } from "@/hooks/use-colors";
import { useI18n, type Language } from "@/lib/i18n";

const LANGUAGES: { code: Language; label: string; native: string; flag: string }[] = [
  { code: "pt", label: "Português", native: "Português (Brasil)", flag: "🇧🇷" },
  { code: "en", label: "English", native: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", native: "Español", flag: "🇪🇸" },
];

export default function I18nSettingsScreen() {
  const colors = useColors();
  const goBack = useSmartBack("/(tabs)/profile");
  const { language, setLanguage, t } = useI18n();

  const handleSelect = async (lang: Language) => {
    if (lang === language) return;
    await setLanguage(lang);
    Alert.alert(
      lang === "pt" ? "Idioma alterado" : lang === "en" ? "Language changed" : "Idioma cambiado",
      lang === "pt"
        ? "O app agora está em Português."
        : lang === "en"
        ? "The app is now in English."
        : "La app ahora está en Español."
    );
  };

  const s = styles(colors);

  return (
    <ScreenContainer>
      <View style={s.header}>
        <BackButton onPress={goBack} label={t("back")} />
        <Text style={s.headerTitle}>{t("settingsLanguage")}</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={s.content}>
        <Text style={s.subtitle}>
          {language === "pt"
            ? "Escolha o idioma do app"
            : language === "en"
            ? "Choose the app language"
            : "Elige el idioma de la app"}
        </Text>

        {LANGUAGES.map((lang) => (
          <Pressable
            key={lang.code}
            style={[s.langCard, language === lang.code && s.langCardActive]}
            onPress={() => handleSelect(lang.code)}
          >
            <Text style={s.langFlag}>{lang.flag}</Text>
            <View style={s.langInfo}>
              <Text style={[s.langLabel, language === lang.code && s.langLabelActive]}>
                {lang.native}
              </Text>
              <Text style={s.langSub}>{lang.label}</Text>
            </View>
            {language === lang.code && (
              <View style={s.checkCircle}>
                <Text style={s.checkMark}>✓</Text>
              </View>
            )}
          </Pressable>
        ))}

        <View style={s.note}>
          <Text style={s.noteText}>
            {language === "pt"
              ? "🌐 Mais idiomas serão adicionados em breve."
              : language === "en"
              ? "🌐 More languages will be added soon."
              : "🌐 Más idiomas se añadirán pronto."}
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.foreground,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    subtitle: {
      fontSize: 15,
      color: colors.muted,
      marginBottom: 20,
    },
    langCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.border,
      gap: 14,
    },
    langCardActive: {
      borderColor: "#1E3A5F",
      backgroundColor: "#1E3A5F10",
    },
    langFlag: {
      fontSize: 32,
    },
    langInfo: {
      flex: 1,
    },
    langLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 2,
    },
    langLabelActive: {
      color: "#1E3A5F",
    },
    langSub: {
      fontSize: 13,
      color: colors.muted,
    },
    checkCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#1E3A5F",
      alignItems: "center",
      justifyContent: "center",
    },
    checkMark: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
    note: {
      marginTop: 16,
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    noteText: {
      fontSize: 13,
      color: colors.muted,
      lineHeight: 18,
    },
  });
