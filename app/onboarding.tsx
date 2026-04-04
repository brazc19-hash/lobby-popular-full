import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useTour } from "@/contexts/tour-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CATEGORIES = [
  { id: "education", label: "Educação", icon: "🎓" },
  { id: "health", label: "Saúde", icon: "🏥" },
  { id: "security", label: "Segurança", icon: "🛡️" },
  { id: "environment", label: "Meio Ambiente", icon: "🌿" },
  { id: "infrastructure", label: "Infraestrutura", icon: "🏗️" },
  { id: "transparency", label: "Transparência", icon: "🔍" },
  { id: "housing", label: "Habitação", icon: "🏠" },
  { id: "transport", label: "Transporte", icon: "🚌" },
  { id: "culture", label: "Cultura", icon: "🎭" },
  { id: "economy", label: "Economia", icon: "💼" },
  { id: "rights", label: "Direitos Civis", icon: "⚖️" },
  { id: "technology", label: "Tecnologia", icon: "💻" },
];

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

const TUTORIAL_STEPS = [
  {
    icon: "📢",
    title: "Como criar um lobby",
    description:
      'Toque no botão "+" na barra inferior. Escolha o tipo (local ou nacional), descreva o problema, informe o artigo da Constituição que embasa sua causa e defina uma meta de apoios.',
  },
  {
    icon: "✊",
    title: "Como pressionar",
    description:
      'Abra qualquer lobby e toque em "Pressionar Agora". Envie mensagens pré-formatadas para deputados via WhatsApp, e-mail ou Twitter com um clique.',
  },
  {
    icon: "🗳️",
    title: "Como votar em plebiscitos",
    description:
      'Lobbys com 5.000+ apoios podem ativar plebiscitos. Vote "Sim" ou "Não" para transformar a causa em Pauta Prioritária e ganhar destaque nacional.',
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { startTour } = useTour();
  const [step, setStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [tutorialStep, setTutorialStep] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const updateProfileMutation = trpc.users.updateProfile.useMutation();

  const totalSteps = 5;

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function finishOnboarding() {
    try {
      // Salvar preferências no perfil
      if (selectedCategories.length > 0 || selectedState) {
        await updateProfileMutation.mutateAsync({
          interests: selectedCategories,
          state: selectedState ?? undefined,
          city: city || undefined,
        });
      }
      // Marcar onboarding como concluído
      await AsyncStorage.setItem("onboarding_completed", "true");
      // Navegar para o feed e iniciar o tour guiado
      router.replace("/(tabs)");
      setTimeout(() => startTour(), 600);
    } catch {
      // Mesmo com erro, avançar para o app
      await AsyncStorage.setItem("onboarding_completed", "true");
      router.replace("/(tabs)");
      setTimeout(() => startTour(), 600);
    }
  }

  function goNext() {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  }

  function goBack() {
    if (step > 0) setStep(step - 1);
  }

  const s = styles(colors, insets);

  // ─── Etapa 0: Boas-vindas ───────────────────────────────────────────────────
  const StepWelcome = (
    <View style={s.stepContainer}>
      <View style={s.welcomeHero}>
        <Text style={s.welcomeEmoji}>🏛️</Text>
        <Text style={s.welcomeTitle}>
          Junte-se à maior rede de causas populares do Brasil
        </Text>
        <Text style={s.welcomeSubtitle}>
          Organize causas, pressione parlamentares e transforme problemas
          reais em projetos de lei — tudo com base na Constituição Federal.
        </Text>
      </View>
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statNumber}>1M+</Text>
          <Text style={s.statLabel}>Cidadãos</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statNumber}>15</Text>
          <Text style={s.statLabel}>PLs gerados</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statNumber}>7</Text>
          <Text style={s.statLabel}>Vitórias</Text>
        </View>
      </View>
    </View>
  );

  // ─── Etapa 1: Interesses ────────────────────────────────────────────────────
  const StepInterests = (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>Quais causas te movem?</Text>
      <Text style={s.stepSubtitle}>
        Escolha pelo menos uma categoria para personalizar seu feed.
      </Text>
      <ScrollView
        style={s.categoriesScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.categoriesGrid}>
          {CATEGORIES.map((cat) => {
            const selected = selectedCategories.includes(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[s.categoryChip, selected && s.categoryChipSelected]}
                onPress={() => toggleCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={s.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    s.categoryLabel,
                    selected && s.categoryLabelSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  // ─── Etapa 2: Localização ───────────────────────────────────────────────────
  const StepLocation = (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>Onde você mora?</Text>
      <Text style={s.stepSubtitle}>
        Compartilhe seu estado para ver lobbys e problemas perto de você.
        Você pode usar um apelido e manter sua localização exata privada.
      </Text>
      <Text style={s.sectionLabel}>Estado</Text>
      <ScrollView
        style={s.statesScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.statesGrid}>
          {STATES.map((uf) => {
            const selected = selectedState === uf;
            return (
              <TouchableOpacity
                key={uf}
                style={[s.stateChip, selected && s.stateChipSelected]}
                onPress={() => setSelectedState(selected ? null : uf)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    s.stateLabel,
                    selected && s.stateLabelSelected,
                  ]}
                >
                  {uf}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <Text style={s.privacyNote}>
        🔒 Sua localização exata nunca é compartilhada. Apenas o estado é
        usado para recomendações.
      </Text>
    </View>
  );

  // ─── Etapa 3: Comunidades sugeridas ─────────────────────────────────────────
  const suggestedCommunities = [
    { name: "Moradores do Centro SP", theme: "security", members: 1240, icon: "🏙️" },
    { name: "Frente Nacional pela Transparência", theme: "transparency", members: 8900, icon: "🔍" },
    { name: "Educação MG em Ação", theme: "education", members: 3400, icon: "🎓" },
    { name: "Saúde para Todos", theme: "health", members: 5600, icon: "🏥" },
    { name: "Mobilidade Urbana Brasil", theme: "transport", members: 2100, icon: "🚌" },
  ];
  const [followedComms, setFollowedComms] = useState<string[]>([]);

  const StepCommunities = (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>Comunidades para você</Text>
      <Text style={s.stepSubtitle}>
        Siga comunidades alinhadas com seus interesses para receber
        atualizações e participar dos debates.
      </Text>
      <ScrollView style={s.commScroll} showsVerticalScrollIndicator={false}>
        {suggestedCommunities.map((comm) => {
          const following = followedComms.includes(comm.name);
          return (
            <View key={comm.name} style={s.commCard}>
              <View style={s.commIcon}>
                <Text style={{ fontSize: 24 }}>{comm.icon}</Text>
              </View>
              <View style={s.commInfo}>
                <Text style={s.commName}>{comm.name}</Text>
                <Text style={s.commMembers}>
                  {comm.members.toLocaleString("pt-BR")} membros
                </Text>
              </View>
              <TouchableOpacity
                style={[s.followBtn, following && s.followBtnActive]}
                onPress={() =>
                  setFollowedComms((prev) =>
                    prev.includes(comm.name)
                      ? prev.filter((c) => c !== comm.name)
                      : [...prev, comm.name]
                  )
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    s.followBtnText,
                    following && s.followBtnTextActive,
                  ]}
                >
                  {following ? "Seguindo" : "Seguir"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  // ─── Etapa 4: Tutorial rápido ───────────────────────────────────────────────
  const StepTutorial = (
    <View style={s.stepContainer}>
      <Text style={s.stepTitle}>Como funciona o Populus?</Text>
      <Text style={s.stepSubtitle}>
        Aprenda em 3 passos como usar o app para fazer a diferença.
      </Text>
      <View style={s.tutorialCard}>
        <Text style={s.tutorialIcon}>
          {TUTORIAL_STEPS[tutorialStep].icon}
        </Text>
        <Text style={s.tutorialTitle}>
          {TUTORIAL_STEPS[tutorialStep].title}
        </Text>
        <Text style={s.tutorialDesc}>
          {TUTORIAL_STEPS[tutorialStep].description}
        </Text>
      </View>
      <View style={s.tutorialDots}>
        {TUTORIAL_STEPS.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setTutorialStep(i)}
            style={[
              s.tutorialDot,
              i === tutorialStep && s.tutorialDotActive,
            ]}
          />
        ))}
      </View>
      {tutorialStep < TUTORIAL_STEPS.length - 1 && (
        <TouchableOpacity
          style={s.tutorialNextBtn}
          onPress={() => setTutorialStep(tutorialStep + 1)}
          activeOpacity={0.8}
        >
          <Text style={s.tutorialNextText}>Próxima dica →</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const steps = [
    StepWelcome,
    StepInterests,
    StepLocation,
    StepCommunities,
    StepTutorial,
  ];

  const stepLabels = [
    "Bem-vindo",
    "Interesses",
    "Localização",
    "Comunidades",
    "Tutorial",
  ];

  const canSkip = step > 0;
  const isLastStep = step === totalSteps - 1;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Progress bar */}
      <View style={s.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              s.progressSegment,
              i <= step ? s.progressSegmentActive : s.progressSegmentInactive,
            ]}
          />
        ))}
      </View>

      {/* Step label */}
      <Text style={s.stepLabel}>
        {step + 1} de {totalSteps} — {stepLabels[step]}
      </Text>

      {/* Content */}
      <View style={s.content}>{steps[step]}</View>

      {/* Footer */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {step > 0 && (
          <TouchableOpacity style={s.backBtn} onPress={goBack} activeOpacity={0.7}>
            <Text style={s.backBtnText}>← Voltar</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        {canSkip && !isLastStep && (
          <TouchableOpacity
            style={s.skipBtn}
            onPress={goNext}
            activeOpacity={0.7}
          >
            <Text style={s.skipBtnText}>Pular</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            s.nextBtn,
            step === 1 && selectedCategories.length === 0 && s.nextBtnDisabled,
          ]}
          onPress={goNext}
          activeOpacity={0.85}
          disabled={step === 1 && selectedCategories.length === 0}
        >
          <Text style={s.nextBtnText}>
            {isLastStep ? "Começar agora 🚀" : "Continuar"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function styles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    progressContainer: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 6,
    },
    progressSegment: {
      flex: 1,
      height: 4,
      borderRadius: 2,
    },
    progressSegmentActive: {
      backgroundColor: colors.primary,
    },
    progressSegmentInactive: {
      backgroundColor: colors.border,
    },
    stepLabel: {
      fontSize: 12,
      color: colors.muted,
      textAlign: "center",
      marginTop: 8,
      marginBottom: 4,
      fontWeight: "500",
    },
    content: {
      flex: 1,
    },
    stepContainer: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 16,
    },
    // Welcome
    welcomeHero: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    },
    welcomeEmoji: {
      fontSize: 72,
    },
    welcomeTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: colors.primary,
      textAlign: "center",
      lineHeight: 34,
    },
    welcomeSubtitle: {
      fontSize: 15,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 22,
    },
    statsRow: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
    },
    statNumber: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.primary,
    },
    statLabel: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.border,
    },
    // Interests
    stepTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.foreground,
      marginBottom: 8,
    },
    stepSubtitle: {
      fontSize: 14,
      color: colors.muted,
      lineHeight: 20,
      marginBottom: 16,
    },
    categoriesScroll: {
      flex: 1,
    },
    categoriesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      paddingBottom: 16,
    },
    categoryChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    categoryChipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.highlight,
    },
    categoryIcon: {
      fontSize: 16,
    },
    categoryLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
    },
    categoryLabelSelected: {
      color: colors.primary,
    },
    // Location
    sectionLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    statesScroll: {
      flex: 1,
    },
    statesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingBottom: 12,
    },
    stateChip: {
      width: 52,
      height: 44,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    stateChipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    stateLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
    },
    stateLabelSelected: {
      color: "#FFFFFF",
    },
    privacyNote: {
      fontSize: 12,
      color: colors.muted,
      textAlign: "center",
      marginTop: 12,
      lineHeight: 18,
    },
    // Communities
    commScroll: {
      flex: 1,
    },
    commCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    commIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.highlight,
      alignItems: "center",
      justifyContent: "center",
    },
    commInfo: {
      flex: 1,
    },
    commName: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 2,
    },
    commMembers: {
      fontSize: 12,
      color: colors.muted,
    },
    followBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: "transparent",
    },
    followBtnActive: {
      backgroundColor: colors.primary,
    },
    followBtnText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
    },
    followBtnTextActive: {
      color: "#FFFFFF",
    },
    // Tutorial
    tutorialCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 28,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 8,
      gap: 12,
    },
    tutorialIcon: {
      fontSize: 56,
    },
    tutorialTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.foreground,
      textAlign: "center",
    },
    tutorialDesc: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 22,
    },
    tutorialDots: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginTop: 20,
    },
    tutorialDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    tutorialDotActive: {
      backgroundColor: colors.primary,
      width: 24,
    },
    tutorialNextBtn: {
      alignSelf: "center",
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    tutorialNextText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.primary,
    },
    // Footer
    footer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    backBtn: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      minWidth: 44,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    backBtnText: {
      fontSize: 15,
      color: colors.muted,
      fontWeight: "600",
    },
    skipBtn: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      minWidth: 44,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    skipBtnText: {
      fontSize: 15,
      color: colors.muted,
      fontWeight: "600",
    },
    nextBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 28,
      minHeight: 50,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 140,
    },
    nextBtnDisabled: {
      opacity: 0.4,
    },
    nextBtnText: {
      fontSize: 15,
      fontWeight: "800",
      color: "#FFFFFF",
    },
  });
}
