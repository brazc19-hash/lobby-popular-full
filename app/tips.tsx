import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

const TIPS_SECTIONS = [
  {
    id: "start",
    icon: "🚀",
    title: "Primeiros Passos",
    color: "#1E3A5F",
    tips: [
      {
        title: "Complete seu perfil",
        description: "Um perfil com foto, bio e localização gera 3x mais engajamento. Acesse Perfil → Editar para personalizar.",
        action: null,
      },
      {
        title: "Faça o tutorial guiado",
        description: "O tour interativo de 8 etapas mostra todas as funcionalidades do app em menos de 5 minutos.",
        action: { label: "Iniciar Tour", route: "/(tabs)" },
      },
      {
        title: "Autentique-se com Gov.br",
        description: "O selo Gov.br aumenta a credibilidade das suas campanhas e pressões. Parlamentares levam mais a sério petições de cidadãos verificados.",
        action: { label: "Entrar com Gov.br", route: "/login-govbr" },
      },
    ],
  },
  {
    id: "campaigns",
    icon: "📢",
    title: "Criando Campanhas Eficazes",
    color: "#2D7D46",
    tips: [
      {
        title: "Use dados concretos no título",
        description: "\"Faltam 47 médicos no SUS de Campinas\" converte muito mais do que \"Melhorar a saúde pública\". Seja específico.",
        action: null,
      },
      {
        title: "Escolha o artigo constitucional certo",
        description: "Use a busca de artigos para encontrar a base legal mais precisa. Artigos específicos (ex: Art. 196 para saúde) são mais persuasivos do que artigos genéricos.",
        action: { label: "Ver Base Legal", route: "/constitution" },
      },
      {
        title: "Defina uma meta realista",
        description: "Campanhas locais com meta de 500 apoios têm taxa de sucesso 4x maior do que campanhas com meta de 50.000. Comece pequeno, cresça depois.",
        action: null,
      },
      {
        title: "Adicione evidências",
        description: "Fotos, documentos e links de notícias aumentam a credibilidade. Inclua fontes confiáveis como IBGE, TCU, Ministérios ou veículos jornalísticos.",
        action: null,
      },
    ],
  },
  {
    id: "pressure",
    icon: "⚡",
    title: "Pressão que Funciona",
    color: "#E8A020",
    tips: [
      {
        title: "Pressione nos momentos certos",
        description: "Segunda e terça-feira de manhã são os melhores horários para contatar parlamentares. Evite sextas-feiras e feriados.",
        action: null,
      },
      {
        title: "Personalize a mensagem",
        description: "O Populus gera uma mensagem base, mas adicione uma frase pessoal sobre como o problema te afeta diretamente. Mensagens pessoais têm 5x mais resposta.",
        action: null,
      },
      {
        title: "Use todos os canais",
        description: "WhatsApp + e-mail + Twitter na mesma semana multiplica o impacto. Parlamentares que recebem pressão em múltiplos canais respondem mais rápido.",
        action: null,
      },
      {
        title: "Mobilize sua rede",
        description: "Compartilhe o QR code da campanha em grupos de WhatsApp, redes sociais e no bairro. Cada novo apoiador aumenta a pressão exponencialmente.",
        action: null,
      },
    ],
  },
  {
    id: "community",
    icon: "👥",
    title: "Construindo Comunidades",
    color: "#8E44AD",
    tips: [
      {
        title: "Crie canais temáticos",
        description: "Separe discussões em canais: #geral para boas-vindas, #estratégia para planejamento, #documentos para evidências. Isso mantém a organização.",
        action: null,
      },
      {
        title: "Fixe posts importantes",
        description: "Use posts fixados para regras da comunidade, resumo da causa e próximos passos. Novos membros precisam entender rapidamente o contexto.",
        action: null,
      },
      {
        title: "Alíe sua comunidade a campanhas",
        description: "Comunidades aliadas a campanhas aparecem na tela de detalhes da campanha, atraindo novos membros organicamente.",
        action: null,
      },
    ],
  },
  {
    id: "gamification",
    icon: "🏆",
    title: "Suba de Nível",
    color: "#C0392B",
    tips: [
      {
        title: "Apoie campanhas diariamente",
        description: "+10 pontos por apoio. Apoiar 10 campanhas por dia = 100 pontos. Em 5 dias você já é Cidadão Ativo.",
        action: { label: "Ver Jornada Cívica", route: "/gamification" },
      },
      {
        title: "Convide amigos",
        description: "Cada amigo convidado que se cadastra vale +100 pontos — o maior bônus do sistema. Use o QR code para facilitar.",
        action: null,
      },
      {
        title: "Nível 4+ libera moderação",
        description: "Ao atingir o nível Líder Popular (2.000 pts), você pode participar do Comitê de Transparência e ajudar a moderar conteúdo.",
        action: null,
      },
    ],
  },
];

export default function TipsScreen() {
  const colors = useColors();
  const goBack = useSmartBack("/(tabs)");
  const [expandedSection, setExpandedSection] = useState<string | null>("start");

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <BackButton onPress={goBack} variant="dark" label="Voltar" />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Dicas Rápidas</Text>
          <Text style={styles.headerSubtitle}>Use o Populus ao máximo</Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Text style={{ fontSize: 20 }}>💡</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Intro */}
        <View style={[styles.introCard, { backgroundColor: colors.highlight, borderColor: colors.border }]}>
          <Text style={[styles.introText, { color: colors.primary }]}>
            💡 Cidadãos que seguem estas dicas conseguem <Text style={{ fontWeight: "800" }}>3x mais apoios</Text> e têm <Text style={{ fontWeight: "800" }}>2x mais chances</Text> de ver suas campanhas virarem projetos de lei.
          </Text>
        </View>

        {/* Sections */}
        {TIPS_SECTIONS.map((section) => {
          const isOpen = expandedSection === section.id;
          return (
            <View key={section.id} style={styles.sectionWrapper}>
              <Pressable
                onPress={() => setExpandedSection(isOpen ? null : section.id)}
                style={({ pressed }) => [
                  styles.sectionHeader,
                  { backgroundColor: section.color, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <Text style={styles.sectionIcon}>{section.icon}</Text>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionCount}>{section.tips.length} dicas</Text>
                </View>
                <IconSymbol
                  name={isOpen ? "chevron.down" : "chevron.right"}
                  size={16}
                  color="#FFFFFF"
                />
              </Pressable>

              {isOpen && (
                <View style={[styles.tipsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {section.tips.map((tip, i) => (
                    <View
                      key={i}
                      style={[
                        styles.tipItem,
                        i < section.tips.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                      ]}
                    >
                      <View style={styles.tipBullet}>
                        <Text style={[styles.tipNumber, { color: section.color }]}>{i + 1}</Text>
                      </View>
                      <View style={styles.tipContent}>
                        <Text style={[styles.tipTitle, { color: colors.foreground }]}>{tip.title}</Text>
                        <Text style={[styles.tipDesc, { color: colors.muted }]}>{tip.description}</Text>
                        {tip.action && (
                          <Pressable
                            onPress={() => router.push(tip.action!.route as never)}
                            style={({ pressed }) => [
                              styles.tipAction,
                              { backgroundColor: section.color + "15", borderColor: section.color + "40" },
                              pressed && { opacity: 0.7 },
                            ]}
                          >
                            <Text style={[styles.tipActionText, { color: section.color }]}>
                              {tip.action.label} →
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* CTA */}
        <Pressable
          onPress={() => router.push("/how-it-works")}
          style={({ pressed }) => [
            styles.ctaCard,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.ctaIcon}>🎬</Text>
          <View style={styles.ctaText}>
            <Text style={styles.ctaTitle}>Quer ver tudo na prática?</Text>
            <Text style={styles.ctaSub}>Assista às animações e simuladores interativos</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color="#FFFFFF" />
        </Pressable>

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
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  introCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 4,
  },
  introText: { fontSize: 14, lineHeight: 22 },
  sectionWrapper: { borderRadius: 16, overflow: "hidden" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
  },
  sectionIcon: { fontSize: 22 },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  sectionBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sectionCount: { fontSize: 11, fontWeight: "600", color: "#FFFFFF" },
  tipsContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  tipItem: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  tipBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  tipNumber: { fontSize: 13, fontWeight: "800" },
  tipContent: { flex: 1, gap: 6 },
  tipTitle: { fontSize: 14, fontWeight: "700", lineHeight: 20 },
  tipDesc: { fontSize: 13, lineHeight: 20 },
  tipAction: {
    alignSelf: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  tipActionText: { fontSize: 13, fontWeight: "600" },
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  ctaIcon: { fontSize: 28 },
  ctaText: { flex: 1 },
  ctaTitle: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  ctaSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
});
