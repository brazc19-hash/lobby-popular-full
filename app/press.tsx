import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { ContextualTip } from "@/components/ui/contextual-tip";

const CATEGORIES = [
  { id: "infrastructure", label: "Infraestrutura" },
  { id: "education", label: "Educação" },
  { id: "health", label: "Saúde" },
  { id: "security", label: "Segurança" },
  { id: "environment", label: "Meio Ambiente" },
  { id: "human_rights", label: "Direitos Humanos" },
  { id: "economy", label: "Economia" },
  { id: "transparency", label: "Transparência" },
];

const REGIONS = [
  { id: "national", label: "Nacional" },
  { id: "SP", label: "São Paulo" },
  { id: "RJ", label: "Rio de Janeiro" },
  { id: "MG", label: "Minas Gerais" },
  { id: "RS", label: "Rio Grande do Sul" },
  { id: "BA", label: "Bahia" },
  { id: "PR", label: "Paraná" },
  { id: "PE", label: "Pernambuco" },
  { id: "CE", label: "Ceará" },
  { id: "other", label: "Outros estados" },
];

export default function PressScreen() {
  const colors = useColors();
  const goBack = useSmartBack("/(tabs)");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [outlet, setOutlet] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["national"]);
  const [minThreshold, setMinThreshold] = useState("1000");
  const [submitted, setSubmitted] = useState(false);

  const registerMutation = trpc.press.register.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      Alert.alert("Erro", err.message || "Não foi possível realizar o cadastro.");
    },
  });

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleRegion = (id: string) => {
    setSelectedRegions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !outlet.trim()) {
      Alert.alert("Campos obrigatórios", "Preencha nome, e-mail e veículo de comunicação.");
      return;
    }
    const threshold = parseInt(minThreshold, 10);
    if (isNaN(threshold) || threshold < 100) {
      Alert.alert("Limite inválido", "O mínimo de apoios deve ser pelo menos 100.");
      return;
    }
    registerMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      outlet: outlet.trim(),
      role: role.trim() || undefined,
      phone: phone.trim() || undefined,
      categories: selectedCategories,
      regions: selectedRegions,
      minSupportThreshold: threshold,
    });
  };

  const s = styles(colors);

  if (submitted) {
    return (
      <ScreenContainer>
        <View style={s.header}>
          <BackButton onPress={goBack} label="Voltar" />
        </View>
        <View style={s.successContainer}>
          <Text style={s.successIcon}>📰</Text>
          <Text style={s.successTitle}>Cadastro realizado!</Text>
          <Text style={s.successText}>
            Você receberá alertas automáticos sobre pautas populares que atendam aos seus critérios.
            Quando um lobby atingir o número mínimo de apoios que você configurou, você será notificado por e-mail.
          </Text>
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>Como funciona</Text>
            <Text style={s.infoItem}>📊 Alertas quando lobbys atingem marcos importantes</Text>
            <Text style={s.infoItem}>🏛️ Notificação quando pautas chegam à Câmara</Text>
            <Text style={s.infoItem}>⭐ Destaque quando lobby vira Pauta Prioritária</Text>
            <Text style={s.infoItem}>📋 Relatórios semanais de pautas em ascensão</Text>
          </View>
          <Pressable style={s.backBtn} onPress={goBack}>
            <Text style={s.backBtnText}>Voltar ao início</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={s.header}>
        <BackButton onPress={goBack} label="Voltar" />
        <Text style={s.headerTitle}>Imprensa</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Contextual Tip */}
        <ContextualTip
          tipKey="press_first_visit"
          emoji="📰"
          title="Alertas para a imprensa"
          body="Configure alertas para receber notificações quando campanhas populares atingirem marcos importantes. Jornalistas e ativistas usam isso para cobrir pautas em ascensão."
        />
        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.heroIcon}>📰</Text>
          <Text style={s.heroTitle}>Alertas para Jornalistas</Text>
          <Text style={s.heroSubtitle}>
            Receba alertas automáticos sobre pautas populares em ascensão, antes que virem notícia.
          </Text>
        </View>

        {/* Benefits */}
        <View style={s.benefitsRow}>
          <View style={s.benefitCard}>
            <Text style={s.benefitIcon}>⚡</Text>
            <Text style={s.benefitLabel}>Tempo real</Text>
          </View>
          <View style={s.benefitCard}>
            <Text style={s.benefitIcon}>🎯</Text>
            <Text style={s.benefitLabel}>Filtrado</Text>
          </View>
          <View style={s.benefitCard}>
            <Text style={s.benefitIcon}>🔒</Text>
            <Text style={s.benefitLabel}>Gratuito</Text>
          </View>
        </View>

        {/* Form */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Dados de contato</Text>

          <Text style={s.label}>Nome completo *</Text>
          <TextInput
            style={s.input}
            placeholder="Seu nome"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />

          <Text style={s.label}>E-mail profissional *</Text>
          <TextInput
            style={s.input}
            placeholder="seu@email.com"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <Text style={s.label}>Veículo de comunicação *</Text>
          <TextInput
            style={s.input}
            placeholder="Ex: Folha de S.Paulo, G1, Agência Brasil..."
            placeholderTextColor={colors.muted}
            value={outlet}
            onChangeText={setOutlet}
            returnKeyType="next"
          />

          <Text style={s.label}>Cargo / Função</Text>
          <TextInput
            style={s.input}
            placeholder="Ex: Repórter, Editor, Correspondente..."
            placeholderTextColor={colors.muted}
            value={role}
            onChangeText={setRole}
            returnKeyType="next"
          />

          <Text style={s.label}>Telefone (opcional)</Text>
          <TextInput
            style={s.input}
            placeholder="(11) 99999-9999"
            placeholderTextColor={colors.muted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="done"
          />
        </View>

        {/* Categories */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Categorias de interesse</Text>
          <Text style={s.sectionSubtitle}>Selecione as pautas que você cobre</Text>
          <View style={s.tagsGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[s.tag, selectedCategories.includes(cat.id) && s.tagActive]}
                onPress={() => toggleCategory(cat.id)}
              >
                <Text style={[s.tagText, selectedCategories.includes(cat.id) && s.tagTextActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Regions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Regiões de cobertura</Text>
          <View style={s.tagsGrid}>
            {REGIONS.map((reg) => (
              <Pressable
                key={reg.id}
                style={[s.tag, selectedRegions.includes(reg.id) && s.tagActive]}
                onPress={() => toggleRegion(reg.id)}
              >
                <Text style={[s.tagText, selectedRegions.includes(reg.id) && s.tagTextActive]}>
                  {reg.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Threshold */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Limite mínimo de apoios</Text>
          <Text style={s.sectionSubtitle}>
            Você só receberá alertas quando um lobby atingir este número de apoios
          </Text>
          <View style={s.thresholdRow}>
            {["500", "1000", "5000", "10000", "50000"].map((val) => (
              <Pressable
                key={val}
                style={[s.thresholdBtn, minThreshold === val && s.thresholdBtnActive]}
                onPress={() => setMinThreshold(val)}
              >
                <Text style={[s.thresholdText, minThreshold === val && s.thresholdTextActive]}>
                  {parseInt(val).toLocaleString("pt-BR")}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Privacy note */}
        <View style={s.privacyNote}>
          <Text style={s.privacyText}>
            🔒 Seus dados são protegidos conforme a LGPD. Usados apenas para envio de alertas jornalísticos.
            Você pode cancelar o cadastro a qualquer momento.
          </Text>
        </View>

        {/* Submit */}
        <Pressable
          style={[s.submitBtn, registerMutation.isPending && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={registerMutation.isPending}
        >
          <Text style={s.submitBtnText}>
            {registerMutation.isPending ? "Cadastrando..." : "Cadastrar para alertas"}
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    scroll: { flex: 1 },
    scrollContent: { padding: 20 },
    hero: {
      alignItems: "center",
      paddingVertical: 24,
      marginBottom: 16,
    },
    heroIcon: { fontSize: 48, marginBottom: 12 },
    heroTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 8,
      textAlign: "center",
    },
    heroSubtitle: {
      fontSize: 15,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 22,
    },
    benefitsRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 24,
    },
    benefitCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    benefitIcon: { fontSize: 24, marginBottom: 4 },
    benefitLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.foreground,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 12,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.foreground,
    },
    tagsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    tag: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    tagActive: {
      borderColor: "#1E3A5F",
      backgroundColor: "#1E3A5F",
    },
    tagText: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.muted,
    },
    tagTextActive: {
      color: "#FFFFFF",
    },
    thresholdRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    thresholdBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    thresholdBtnActive: {
      borderColor: "#2D7D46",
      backgroundColor: "#2D7D46",
    },
    thresholdText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
    },
    thresholdTextActive: {
      color: "#FFFFFF",
    },
    privacyNote: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    privacyText: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 18,
    },
    submitBtn: {
      backgroundColor: "#1E3A5F",
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
    },
    submitBtnDisabled: {
      opacity: 0.6,
    },
    submitBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    // Success state
    successContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
    },
    successIcon: { fontSize: 64, marginBottom: 16 },
    successTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 12,
      textAlign: "center",
    },
    successText: {
      fontSize: 15,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 24,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      width: "100%",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 24,
      gap: 8,
    },
    infoTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 4,
    },
    infoItem: {
      fontSize: 14,
      color: colors.muted,
      lineHeight: 20,
    },
    backBtn: {
      backgroundColor: "#1E3A5F",
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 32,
      alignItems: "center",
    },
    backBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });
