import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

const STATS = [
  { value: "1M+", label: "Cidadãos" },
  { value: "15", label: "PLs gerados" },
  { value: "7", label: "Vitórias" },
  { value: "27", label: "Estados" },
];

const VALUES = [
  {
    icon: "⚖️",
    title: "Base Legal Sólida",
    description: "Toda campanha é ancorada na Constituição Federal, garantindo legitimidade e proteção jurídica para os cidadãos.",
  },
  {
    icon: "🔍",
    title: "Transparência Total",
    description: "Todas as ações, apoios e pressões são registrados e auditáveis. Nada acontece nas sombras.",
  },
  {
    icon: "🤝",
    title: "Democracia Participativa",
    description: "Acreditamos que qualquer cidadão tem o direito e o poder de influenciar as leis que regem sua vida.",
  },
  {
    icon: "🛡️",
    title: "Uso Responsável",
    description: "Sistema de moderação com IA e revisão humana impede uso criminoso ou anticonstitucional da plataforma.",
  },
];

const TEAM = [
  { name: "Equipe Populus", role: "Desenvolvimento e Missão", emoji: "🏛️" },
  { name: "Comitê de Transparência", role: "Cidadãos nível 4+ que revisam conteúdo", emoji: "👥" },
  { name: "Consultores Jurídicos", role: "Especialistas em Direito Constitucional", emoji: "⚖️" },
];

export default function AboutScreen() {
  const colors = useColors();
  const goBack = useSmartBack("/(tabs)");

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <BackButton onPress={goBack} variant="dark" label="Voltar" />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Sobre o Populus</Text>
          <Text style={styles.headerSubtitle}>Democracia para todos</Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Text style={{ fontSize: 20 }}>🏛️</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroEmoji}>🏛️</Text>
          <Text style={styles.heroTitle}>Populus</Text>
          <Text style={styles.heroTagline}>
            A plataforma de lobby popular que transforma cidadãos em legisladores
          </Text>
          <Text style={styles.heroVersion}>Versão 1.0.0 · Lançado em 2026</Text>
        </View>

        {/* Missão */}
        <View style={styles.sectionLabel}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>NOSSA MISSÃO</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.missionText, { color: colors.foreground }]}>
            O Populus nasceu da crença de que a democracia não termina no dia da eleição. Qualquer cidadão brasileiro tem o direito constitucional de participar ativamente da criação e modificação das leis que regem sua vida.
          </Text>
          <Text style={[styles.missionText, { color: colors.foreground, marginTop: 12 }]}>
            Nossa missão é democratizar o acesso ao lobby político — uma ferramenta que historicamente esteve disponível apenas para grandes empresas e grupos de interesse — e colocá-la nas mãos de qualquer pessoa com um smartphone.
          </Text>
        </View>

        {/* Estatísticas */}
        <View style={styles.sectionLabel}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>IMPACTO REAL</Text>
        </View>
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Valores */}
        <View style={styles.sectionLabel}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>NOSSOS VALORES</Text>
        </View>
        {VALUES.map((v) => (
          <View key={v.title} style={[styles.valueCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.valueIcon}>{v.icon}</Text>
            <View style={styles.valueText}>
              <Text style={[styles.valueTitle, { color: colors.foreground }]}>{v.title}</Text>
              <Text style={[styles.valueDesc, { color: colors.muted }]}>{v.description}</Text>
            </View>
          </View>
        ))}

        {/* Base Legal */}
        <View style={styles.sectionLabel}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>BASE CONSTITUCIONAL</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.highlight, borderColor: colors.border }]}>
          <Text style={[styles.legalTitle, { color: colors.primary }]}>
            "Todo poder emana do povo, que o exerce por meio de representantes eleitos ou diretamente."
          </Text>
          <Text style={[styles.legalRef, { color: colors.muted }]}>— Art. 1º, Parágrafo único, Constituição Federal de 1988</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.legalDesc, { color: colors.muted }]}>
            O Populus opera com base nos artigos 5º (direitos fundamentais), 6º (direitos sociais), 14º (soberania popular), 37º (administração pública), 196º (saúde), 205º (educação) e 225º (meio ambiente) da Constituição Federal.
          </Text>
        </View>

        {/* Equipe */}
        <View style={styles.sectionLabel}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>QUEM FAZ O POPULUS</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {TEAM.map((member, i) => (
            <View
              key={member.name}
              style={[
                styles.teamRow,
                i < TEAM.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.teamEmoji, { backgroundColor: colors.highlight }]}>
                <Text style={{ fontSize: 20 }}>{member.emoji}</Text>
              </View>
              <View style={styles.teamText}>
                <Text style={[styles.teamName, { color: colors.foreground }]}>{member.name}</Text>
                <Text style={[styles.teamRole, { color: colors.muted }]}>{member.role}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Links */}
        <View style={styles.sectionLabel}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>CONTATO E LINKS</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { icon: "globe", label: "Site oficial", url: "https://populus.app.br", sublabel: "populus.app.br" },
            { icon: "envelope.fill", label: "Suporte", url: "mailto:suporte@populus.app.br", sublabel: "suporte@populus.app.br" },
            { icon: "lock.fill", label: "Política de Privacidade", url: null, sublabel: "Conforme a LGPD" },
          ].map((link, i, arr) => (
            <Pressable
              key={link.label}
              onPress={() => link.url && Linking.openURL(link.url)}
              style={({ pressed }) => [
                styles.linkRow,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <IconSymbol name={link.icon as any} size={18} color={colors.primary} />
              <View style={styles.linkText}>
                <Text style={[styles.linkLabel, { color: colors.foreground }]}>{link.label}</Text>
                <Text style={[styles.linkSub, { color: colors.muted }]}>{link.sublabel}</Text>
              </View>
              {link.url && <IconSymbol name="chevron.right" size={14} color={colors.muted} />}
            </Pressable>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            🏛️ Populus · Feito com 💚 para a democracia brasileira
          </Text>
          <Text style={[styles.footerSub, { color: colors.muted }]}>
            © 2026 Populus · Todos os direitos reservados
          </Text>
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
  heroCard: {
    margin: 16,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 32, fontWeight: "900", color: "#FFFFFF" },
  heroTagline: { fontSize: 15, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 22 },
  heroVersion: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  sectionLabel: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8 },
  card: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 16 },
  missionText: { fontSize: 15, lineHeight: 24 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 28, fontWeight: "900" },
  statLabel: { fontSize: 13, fontWeight: "500" },
  valueCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  valueIcon: { fontSize: 26, marginTop: 2 },
  valueText: { flex: 1 },
  valueTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  valueDesc: { fontSize: 13, lineHeight: 20 },
  legalTitle: { fontSize: 15, fontWeight: "600", lineHeight: 24, fontStyle: "italic" },
  legalRef: { fontSize: 12, marginTop: 6 },
  divider: { height: 1, marginVertical: 12 },
  legalDesc: { fontSize: 13, lineHeight: 20 },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  teamEmoji: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  teamText: { flex: 1 },
  teamName: { fontSize: 15, fontWeight: "600" },
  teamRole: { fontSize: 12, marginTop: 2 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  linkText: { flex: 1 },
  linkLabel: { fontSize: 15, fontWeight: "500" },
  linkSub: { fontSize: 12, marginTop: 2 },
  footer: { alignItems: "center", paddingTop: 24, gap: 4 },
  footerText: { fontSize: 13, fontWeight: "500" },
  footerSub: { fontSize: 11 },
});
