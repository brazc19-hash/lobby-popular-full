import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

type Category = "all" | "campaigns" | "communities" | "pressure" | "account" | "legal";

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "all", label: "Todos", icon: "🔍" },
  { id: "campaigns", label: "Campanhas", icon: "📢" },
  { id: "communities", label: "Comunidades", icon: "👥" },
  { id: "pressure", label: "Pressão", icon: "⚡" },
  { id: "account", label: "Conta", icon: "👤" },
  { id: "legal", label: "Jurídico", icon: "⚖️" },
];

const FAQ = [
  {
    category: "campaigns" as Category,
    question: "Como criar uma campanha no Populus?",
    answer: "Toque no botão '+' na barra de navegação inferior. Escolha o tipo (Nacional ou Local), preencha o título, descrição e objetivo, selecione o artigo da Constituição que fundamenta sua causa e, se for local, marque o ponto no mapa. Sua campanha passará por moderação automática antes de ser publicada.",
  },
  {
    category: "campaigns" as Category,
    question: "Qual a diferença entre campanha Nacional e Local?",
    answer: "Campanhas Nacionais buscam mudanças em leis federais ou políticas públicas que afetam todo o Brasil. Campanhas Locais são voltadas para problemas específicos de um bairro, cidade ou região — como buracos na rua, falta de iluminação ou problemas em escolas municipais.",
  },
  {
    category: "campaigns" as Category,
    question: "Por que minha campanha precisa de uma base legal?",
    answer: "A Constituição Federal garante o direito de petição e participação popular. Ao vincular sua campanha a um artigo constitucional, você demonstra que está exercendo um direito legítimo — não fazendo uma exigência arbitrária. Isso também protege você juridicamente e aumenta a credibilidade da causa.",
  },
  {
    category: "campaigns" as Category,
    question: "Quanto tempo leva para minha campanha ser aprovada?",
    answer: "A IA do Populus analisa o conteúdo em segundos. Se não houver problemas, a campanha é publicada automaticamente. Casos que precisam de revisão humana são analisados pelo Comitê de Transparência em até 48 horas.",
  },
  {
    category: "pressure" as Category,
    question: "Como funciona o sistema de pressão?",
    answer: "Na tela de detalhes de uma campanha, toque em 'Pressionar Parlamentares'. O Populus gera automaticamente uma mensagem personalizada com os dados da campanha. Você pode enviá-la por WhatsApp, e-mail, Twitter/X ou fazer uma ligação direta para o gabinete do parlamentar.",
  },
  {
    category: "pressure" as Category,
    question: "Quais parlamentares devo pressionar?",
    answer: "O Populus sugere parlamentares com base na categoria da campanha e na sua localização. Para campanhas locais, priorizamos vereadores e deputados estaduais do seu município. Para campanhas nacionais, mostramos parlamentares membros das comissões relevantes.",
  },
  {
    category: "communities" as Category,
    question: "O que são comunidades no Populus?",
    answer: "Comunidades são grupos organizados em torno de uma causa ou tema. Dentro de cada comunidade há canais de discussão (#geral, #estratégia, #documentos), posts fixados e a possibilidade de aliar a comunidade a campanhas específicas.",
  },
  {
    category: "communities" as Category,
    question: "Como criar uma comunidade?",
    answer: "Acesse a aba 'Comunidades', toque em 'Criar Comunidade', escolha um nome, descrição e tema. Você se torna automaticamente o administrador da comunidade e pode convidar outros membros.",
  },
  {
    category: "account" as Category,
    question: "Como fazer login com Gov.br?",
    answer: "Na tela de Perfil, toque em 'Entrar com Gov.br'. Você precisará informar seu CPF e confirmar seu nome completo. A autenticação Gov.br adiciona um selo de verificação ao seu perfil, aumentando a credibilidade das suas ações.",
  },
  {
    category: "account" as Category,
    question: "O que são os níveis de cidadão?",
    answer: "O sistema de gamificação do Populus tem 5 níveis: Observador (0 pts), Cidadão Ativo (100 pts), Ativista (500 pts), Líder Popular (2.000 pts) e Herói Popular (10.000 pts). Você ganha pontos apoiando campanhas (+10), criando campanhas (+50), pressionando parlamentares (+20) e compartilhando (+5).",
  },
  {
    category: "account" as Category,
    question: "Como funciona o modo offline?",
    answer: "Campanhas que você visualizou recentemente ficam salvas automaticamente no seu dispositivo. Você pode acessá-las sem internet em 'Perfil → Lobbys Salvos'. Novas ações (apoios, pressões) serão sincronizadas quando você reconectar.",
  },
  {
    category: "legal" as Category,
    question: "O Populus é legal? Posso ser processado?",
    answer: "Sim, o Populus é completamente legal. O direito de petição está garantido no Art. 5º, XXXIV da Constituição Federal. O direito de participação popular em processos legislativos é reafirmado pelo STF. Desde que sua campanha não contenha ameaças, discurso de ódio ou informações falsas, você está exercendo um direito constitucional.",
  },
  {
    category: "legal" as Category,
    question: "Meus dados estão protegidos?",
    answer: "Sim. O Populus segue rigorosamente a Lei Geral de Proteção de Dados (LGPD). Você pode controlar a visibilidade do seu perfil, usar anonimato parcial, exportar seus dados ou solicitar a exclusão da conta a qualquer momento em 'Configurações → Privacidade e LGPD'.",
  },
];

function FAQItem({ item }: { item: typeof FAQ[0] }) {
  const [open, setOpen] = useState(false);
  const colors = useColors();

  return (
    <Pressable
      onPress={() => setOpen(!open)}
      style={({ pressed }) => [
        styles.faqItem,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.faqHeader}>
        <Text style={[styles.faqQuestion, { color: colors.foreground }]}>{item.question}</Text>
        <IconSymbol
          name={open ? "chevron.down" : "chevron.right"}
          size={16}
          color={colors.muted}
        />
      </View>
      {open && (
        <Text style={[styles.faqAnswer, { color: colors.muted }]}>{item.answer}</Text>
      )}
    </Pressable>
  );
}

export default function HelpScreen() {
  const colors = useColors();
  const goBack = useSmartBack("/(tabs)");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filtered = FAQ.filter((item) => {
    const matchCat = activeCategory === "all" || item.category === activeCategory;
    const matchSearch = search.length === 0 ||
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <BackButton onPress={goBack} variant="dark" label="Voltar" />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Central de Ajuda</Text>
          <Text style={styles.headerSubtitle}>Perguntas frequentes</Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <IconSymbol name="questionmark.circle.fill" size={20} color="#FFFFFF" />
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar na Central de Ajuda..."
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.foreground }]}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => setActiveCategory(cat.id)}
            style={[
              styles.catChip,
              activeCategory === cat.id
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}
          >
            <Text style={styles.catIcon}>{cat.icon}</Text>
            <Text style={[
              styles.catLabel,
              { color: activeCategory === cat.id ? "#FFFFFF" : colors.muted },
            ]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum resultado</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Tente outros termos ou use o chat com IA para perguntas específicas.
            </Text>
          </View>
        ) : (
          <View style={styles.faqList}>
            {filtered.map((item, i) => (
              <FAQItem key={i} item={item} />
            ))}
          </View>
        )}

        {/* CTA Chat IA */}
        <Pressable
          onPress={() => router.push("/help-chat")}
          style={({ pressed }) => [
            styles.chatCta,
            { backgroundColor: colors.secondary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.chatCtaIcon}>🤖</Text>
          <View style={styles.chatCtaText}>
            <Text style={styles.chatCtaTitle}>Não encontrou o que procurava?</Text>
            <Text style={styles.chatCtaSub}>Pergunte diretamente à IA do Populus</Text>
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
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  categories: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  catIcon: { fontSize: 14 },
  catLabel: { fontSize: 13, fontWeight: "600" },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  faqList: { gap: 10 },
  faqItem: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  faqQuestion: { flex: 1, fontSize: 15, fontWeight: "600", lineHeight: 22 },
  faqAnswer: { fontSize: 14, lineHeight: 22, marginTop: 12 },
  empty: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  chatCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  chatCtaIcon: { fontSize: 28 },
  chatCtaText: { flex: 1 },
  chatCtaTitle: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  chatCtaSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
});
