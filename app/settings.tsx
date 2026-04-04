import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function SettingsScreen() {
  const colors = useColors();
  const goBack = useSmartBack("/(tabs)");
  const { language, setLanguage, t } = useI18n();
  const { user } = useAuth();
  const colorScheme = useColorScheme();

  const [notifCampaigns, setNotifCampaigns] = useState(true);
  const [notifCommunity, setNotifCommunity] = useState(true);
  const [notifCongress, setNotifCongress] = useState(false);
  const [notifPressure, setNotifPressure] = useState(true);

  const LANGUAGES = [
    { code: "pt" as const, label: "Português (Brasil)", flag: "🇧🇷" },
    { code: "en" as const, label: "English", flag: "🇺🇸" },
    { code: "es" as const, label: "Español", flag: "🇪🇸" },
  ];

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <BackButton onPress={goBack} variant="dark" label="Voltar" />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Configurações</Text>
          <Text style={styles.headerSubtitle}>Personalize sua experiência</Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <IconSymbol name="gearshape.fill" size={20} color="#FFFFFF" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Idioma */}
        <View style={styles.sectionLabel}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>IDIOMA DO APLICATIVO</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {LANGUAGES.map((lang, i) => (
            <Pressable
              key={lang.code}
              onPress={() => setLanguage(lang.code)}
              style={({ pressed }) => [
                styles.langRow,
                i < LANGUAGES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={[styles.langLabel, { color: colors.foreground }]}>{lang.label}</Text>
              {language === lang.code && (
                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.secondary} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Notificações */}
        <View style={styles.sectionLabel}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>NOTIFICAÇÕES</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { label: "Atualizações de campanhas", sublabel: "Novas metas, vitórias e marcos", value: notifCampaigns, setter: setNotifCampaigns },
            { label: "Atividade nas comunidades", sublabel: "Novos posts e comentários", value: notifCommunity, setter: setNotifCommunity },
            { label: "Agenda do Congresso", sublabel: "Votações relevantes para suas causas", value: notifCongress, setter: setNotifCongress },
            { label: "Alertas de pressão", sublabel: "Momento certo para pressionar parlamentares", value: notifPressure, setter: setNotifPressure },
          ].map((item, i, arr) => (
            <View
              key={item.label}
              style={[
                styles.switchRow,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.switchText}>
                <Text style={[styles.switchLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.switchSublabel, { color: colors.muted }]}>{item.sublabel}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.setter}
                trackColor={{ false: colors.border, true: colors.secondary }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        {/* Aparência */}
        <View style={styles.sectionLabel}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>APARÊNCIA</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <IconSymbol name="moon.fill" size={18} color={colors.muted} />
            <View style={styles.infoText}>
              <Text style={[styles.infoLabel, { color: colors.foreground }]}>Tema do sistema</Text>
              <Text style={[styles.infoValue, { color: colors.muted }]}>
                {colorScheme === "dark" ? "Modo escuro ativo" : "Modo claro ativo"} · Segue o dispositivo
              </Text>
            </View>
          </View>
        </View>

        {/* Conta */}
        <View style={styles.sectionLabel}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>CONTA</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            onPress={() => router.push("/i18n-settings")}
            style={({ pressed }) => [styles.menuRow, { borderBottomWidth: 1, borderBottomColor: colors.border }, pressed && { opacity: 0.7 }]}
          >
            <IconSymbol name="globe" size={18} color={colors.primary} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Configurações de idioma avançadas</Text>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/privacy")}
            style={({ pressed }) => [styles.menuRow, { borderBottomWidth: 1, borderBottomColor: colors.border }, pressed && { opacity: 0.7 }]}
          >
            <IconSymbol name="lock.fill" size={18} color={colors.primary} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Privacidade e LGPD</Text>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.7 }]}
          >
            <IconSymbol name="person.fill" size={18} color={colors.primary} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Editar perfil</Text>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </Pressable>
        </View>

        {/* Sobre */}
        <View style={[styles.versionBox, { backgroundColor: colors.highlight }]}>
          <Text style={[styles.versionText, { color: colors.muted }]}>Populus v1.0.0</Text>
          <Text style={[styles.versionSub, { color: colors.muted }]}>Democracia participativa para todos os brasileiros</Text>
        </View>

      </ScrollView>
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
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  headerIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  scroll: { paddingBottom: 40 },
  sectionLabel: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8 },
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  langFlag: { fontSize: 22 },
  langLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  switchText: { flex: 1 },
  switchLabel: { fontSize: 15, fontWeight: "500" },
  switchSublabel: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 15, fontWeight: "500" },
  infoValue: { fontSize: 12, marginTop: 2 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  versionBox: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  versionText: { fontSize: 13, fontWeight: "600" },
  versionSub: { fontSize: 12, textAlign: "center", lineHeight: 18 },
});
