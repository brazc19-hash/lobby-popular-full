import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useTour } from "@/contexts/tour-context";
import { useColors } from "@/hooks/use-colors";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// ─── Utilitário: barra de progresso ─────────────────────────────────────────

function TourProgressBar({ current, total }: { current: number; total: number }) {
  const progress = total > 1 ? current / (total - 1) : 1;
  return (
    <View style={styles.progressBarContainer}>
      <Text style={styles.progressLabel}>Passo {current + 1} de {total}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
      </View>
    </View>
  );
}

// Alias para compatibilidade retroativa
const ProgressDots = TourProgressBar;

// ─── Tela 1: Boas-Vindas ────────────────────────────────────────────────────

function WelcomeStep() {
  const { nextStep, skipTour } = useTour();
  const colors = useColors();

  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    const makeFloat = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: -12, duration: 1400, delay, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 1400, useNativeDriver: true }),
        ])
      );
    makeFloat(float1, 0).start();
    makeFloat(float2, 400).start();
    makeFloat(float3, 800).start();
  }, []);

  const handleStart = () => {
    setTimeout(() => nextStep(), 400);
  };

  return (
    <Animated.View style={[styles.welcomeCard, { backgroundColor: colors.surface, opacity: fadeIn }]}>
      <View style={styles.illustrationRow}>
        <Animated.View style={[styles.citizenBubble, { backgroundColor: "#1E3A5F20", transform: [{ translateY: float1 }] }]}>
          <Text style={styles.citizenEmoji}>👩‍💼</Text>
        </Animated.View>
        <Animated.View style={[styles.citizenBubble, styles.citizenBubbleCenter, { backgroundColor: "#2D7D4620", transform: [{ translateY: float2 }] }]}>
          <Text style={[styles.citizenEmoji, { fontSize: 44 }]}>🏛️</Text>
        </Animated.View>
        <Animated.View style={[styles.citizenBubble, { backgroundColor: "#1E3A5F20", transform: [{ translateY: float3 }] }]}>
          <Text style={styles.citizenEmoji}>👨‍🏫</Text>
        </Animated.View>
      </View>
      <View style={styles.connectorRow}>
        <View style={[styles.connector, { backgroundColor: "#2D7D46" }]} />
        <View style={[styles.connector, { backgroundColor: "#2D7D46" }]} />
      </View>
      <Text style={[styles.welcomeTitle, { color: "#1E3A5F" }]}>Bem-vindo ao Populus</Text>
      <Text style={[styles.welcomeSubtitle, { color: colors.muted }]}>
        A plataforma Populus. Aqui você pode transformar problemas da sua comunidade em ações reais no Congresso.
      </Text>
      <Text style={[styles.welcomeTime, { color: colors.muted }]}>
        Vamos te mostrar como funciona em 2 minutos.
      </Text>
      <Pressable
        onPress={handleStart}
        style={({ pressed }) => [styles.startBtn, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.startBtnText}>Começar Tour</Text>
      </Pressable>
      <Pressable
        onPress={skipTour}
        style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={[styles.skipBtnText, { color: colors.muted }]}>Pular</Text>
      </Pressable>
      <ProgressDots current={0} total={6} />
    </Animated.View>
  );
}

// ─── Tela 2: Descobrindo Causas ──────────────────────────────────────────────

function ExploreFiltersStep() {
  const { nextStep, prevStep, skipTour, filterBarLayout } = useTour();
  const colors = useColors();
  const pulse = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spotY = filterBarLayout ? filterBarLayout.y - 8 : SCREEN_H * 0.18;
  const spotH = filterBarLayout ? filterBarLayout.height + 16 : 56;

  return (
    <>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.overlayDark, { height: Math.max(0, spotY) }]} />
        <View style={{ height: spotH, backgroundColor: "transparent" }} />
        <View style={[styles.overlayDark, { flex: 1 }]} />
      </View>
      <Animated.View
        pointerEvents="none"
        style={[styles.spotlightBorder, { top: spotY - 4, height: spotH + 8, transform: [{ scaleX: pulse }] }]}
      />
      <Animated.View
        style={[styles.tooltipCard, { backgroundColor: colors.surface, top: spotY + spotH + 16, opacity: fadeIn }]}
      >
        <View style={styles.tooltipArrowUp} />
        <Text style={[styles.tooltipTitle, { color: "#1E3A5F" }]}>🔍 Descobrindo Causas</Text>
        <Text style={[styles.tooltipBody, { color: colors.foreground }]}>
          Aqui você encontra lobbys e petições de todo o Brasil. Use os filtros para encontrar causas perto de você ou sobre temas que te interessam.
        </Text>
        <View style={[styles.exampleBox, { backgroundColor: "#2D7D4610", borderColor: "#2D7D4640" }]}>
          <Text style={[styles.exampleText, { color: "#2D7D46" }]}>
            💡 Experimente: filtre por "Infraestrutura Urbana" em "São Paulo"
          </Text>
        </View>
        <View style={styles.tooltipActions}>
          <Pressable onPress={skipTour} style={({ pressed }) => [styles.tooltipSkip, { opacity: pressed ? 0.7 : 1 }]}>
            <Text style={[styles.tooltipSkipText, { color: colors.muted }]}>Sair</Text>
          </Pressable>
          <View style={styles.navBtns}>
            <Pressable onPress={() => prevStep()} style={({ pressed }) => [styles.tooltipPrev, { opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[styles.tooltipPrevText, { color: colors.muted }]}>← Anterior</Text>
            </Pressable>
            <Pressable
              onPress={() => nextStep()}
              style={({ pressed }) => [styles.tooltipNext, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.tooltipNextText}>Próximo →</Text>
            </Pressable>
          </View>
        </View>
        <TourProgressBar current={1} total={8} />
      </Animated.View>
    </>
  );
}

// ─── Tela 3: Apoiando uma Causa ──────────────────────────────────────────────

function SupportLobbyStep() {
  const { nextStep, prevStep, skipTour, supportButtonLayout } = useTour();
  const colors = useColors();
  const pulse = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [showSuccess, setShowSuccess] = React.useState(false);
  const successScale = useRef(new Animated.Value(0.7)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSimulateSupport = () => {
    setShowSuccess(true);
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, useNativeDriver: true, bounciness: 12 }),
      Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const spotY = supportButtonLayout ? supportButtonLayout.y - 8 : SCREEN_H * 0.55;
  const spotH = supportButtonLayout ? supportButtonLayout.height + 16 : 56;

  return (
    <>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.overlayDark, { height: Math.max(0, spotY) }]} />
        <View style={{ height: spotH, backgroundColor: "transparent" }} />
        <View style={[styles.overlayDark, { flex: 1 }]} />
      </View>
      <Animated.View
        pointerEvents="none"
        style={[styles.spotlightBorder, { top: spotY - 4, height: spotH + 8, borderColor: "#2D7D46", transform: [{ scaleX: pulse }] }]}
      />
      {showSuccess ? (
        <Animated.View
          style={[styles.successCard, { backgroundColor: colors.surface, opacity: successOpacity, transform: [{ scale: successScale }] }]}
        >
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={[styles.successTitle, { color: "#2D7D46" }]}>Parabéns!</Text>
          <Text style={[styles.successBody, { color: colors.foreground }]}>
            Você acaba de se tornar um apoiador. Agora você receberá atualizações sobre esta causa.
          </Text>
          <View style={[styles.counterRow, { backgroundColor: "#2D7D4610" }]}>
            <Text style={[styles.counterText, { color: "#2D7D46" }]}>+1 apoiador</Text>
            <Text style={[styles.counterPoints, { color: "#1E3A5F" }]}>+10 pontos 🏆</Text>
          </View>
          <Pressable
            onPress={() => nextStep()}
            style={({ pressed }) => [styles.startBtn, { marginTop: 20, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.startBtnText}>Próximo →</Text>
          </Pressable>
          <ProgressDots current={2} total={6} />
        </Animated.View>
      ) : (
        <Animated.View
          style={[styles.tooltipCard, { backgroundColor: colors.surface, top: Math.max(16, spotY - 220), opacity: fadeIn }]}
        >
          <Text style={[styles.tooltipTitle, { color: "#1E3A5F" }]}>✊ Apoiando uma Causa</Text>
          <Text style={[styles.tooltipBody, { color: colors.foreground }]}>
            Encontrou uma causa que te representa? Clique em "Apoiar" para se juntar a outros cidadãos. Quanto mais apoiadores, mais força o lobby tem.
          </Text>
          <View style={styles.tooltipArrowDown} />
          <View style={styles.tooltipActions}>
            <Pressable onPress={skipTour} style={({ pressed }) => [styles.tooltipSkip, { opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[styles.tooltipSkipText, { color: colors.muted }]}>Sair</Text>
            </Pressable>
            <View style={styles.navBtns}>
              <Pressable onPress={() => prevStep()} style={({ pressed }) => [styles.tooltipPrev, { opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[styles.tooltipPrevText, { color: colors.muted }]}>← Anterior</Text>
              </Pressable>
              <Pressable
                onPress={handleSimulateSupport}
                style={({ pressed }) => [styles.tooltipNext, { backgroundColor: "#2D7D46", opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.tooltipNextText}>Simular Apoio 👍</Text>
              </Pressable>
            </View>
          </View>
            <TourProgressBar current={2} total={8} />
        </Animated.View>
      )}
    </>
  );
}

// ─── Tela 4: Pressionando Parlamentaress ─────────────────────────────────────

function PressActionStep() {
  const { nextStep, prevStep, skipTour, pressButtonLayout } = useTour();
  const colors = useColors();
  const pulse = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [showSimulation, setShowSimulation] = React.useState(false);
  const simScale = useRef(new Animated.Value(0.8)).current;
  const simOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSimulatePress = () => {
    setShowSimulation(true);
    Animated.parallel([
      Animated.spring(simScale, { toValue: 1, useNativeDriver: true, bounciness: 10 }),
      Animated.timing(simOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const spotY = pressButtonLayout ? pressButtonLayout.y - 8 : SCREEN_H * 0.5;
  const spotH = pressButtonLayout ? pressButtonLayout.height + 16 : 52;

  return (
    <>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.overlayDark, { height: Math.max(0, spotY) }]} />
        <View style={{ height: spotH, backgroundColor: "transparent" }} />
        <View style={[styles.overlayDark, { flex: 1 }]} />
      </View>
      <Animated.View
        pointerEvents="none"
        style={[styles.spotlightBorder, { top: spotY - 4, height: spotH + 8, borderColor: "#C0392B", transform: [{ scaleX: pulse }] }]}
      />

      {showSimulation ? (
        <Animated.View
          style={[styles.successCard, { backgroundColor: colors.surface, opacity: simOpacity, transform: [{ scale: simScale }] }]}
        >
          <Text style={styles.successEmoji}>📨</Text>
          <Text style={[styles.successTitle, { color: "#C0392B" }]}>Mensagem Enviada!</Text>
          <Text style={[styles.successBody, { color: colors.foreground }]}>
            Pronto! Sua mensagem foi enviada (modo tutorial). Na vida real, isso chegaria direto ao gabinete do deputado.
          </Text>

          {/* Canais disponíveis */}
          <View style={[styles.channelsRow, { backgroundColor: "#F8F9FA", borderColor: "#E5E7EB" }]}>
            <View style={styles.channelItem}>
              <Text style={styles.channelIcon}>📱</Text>
              <Text style={[styles.channelLabel, { color: colors.foreground }]}>WhatsApp</Text>
            </View>
            <View style={[styles.channelDivider, { backgroundColor: "#E5E7EB" }]} />
            <View style={styles.channelItem}>
              <Text style={styles.channelIcon}>📧</Text>
              <Text style={[styles.channelLabel, { color: colors.foreground }]}>E-mail</Text>
            </View>
            <View style={[styles.channelDivider, { backgroundColor: "#E5E7EB" }]} />
            <View style={styles.channelItem}>
              <Text style={styles.channelIcon}>🐦</Text>
              <Text style={[styles.channelLabel, { color: colors.foreground }]}>Twitter</Text>
            </View>
          </View>

          {/* Metas de pressão */}
          <View style={[styles.metricsBox, { backgroundColor: "#FFF3F3", borderColor: "#FECACA" }]}>
            <Text style={[styles.metricsTitle, { color: "#C0392B" }]}>🎯 Metas de Pressão</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricIcon}>🏛️</Text>
              <Text style={[styles.metricText, { color: colors.foreground }]}>
                <Text style={{ fontWeight: "700" }}>1.000 envios</Text> → Audiência pública garantida
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricIcon}>⚖️</Text>
              <Text style={[styles.metricText, { color: colors.foreground }]}>
                <Text style={{ fontWeight: "700" }}>10.000 envios</Text> → Projeto pode virar lei
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => nextStep()}
            style={({ pressed }) => [styles.startBtn, { marginTop: 16, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.startBtnText}>Próximo →</Text>
          </Pressable>
          <ProgressDots current={3} total={8} />
        </Animated.View>
      ) : (
        <Animated.View
          style={[styles.tooltipCard, { backgroundColor: colors.surface, top: Math.max(16, spotY - 260), opacity: fadeIn }]}
        >
          <Text style={[styles.tooltipTitle, { color: "#C0392B" }]}>📣 Pressionando Parlamentares</Text>
          <Text style={[styles.tooltipBody, { color: colors.foreground }]}>
            Esta é a ferramenta mais poderosa do Populus. Quando uma causa atinge a fase de pressão, você pode enviar mensagens diretamente para os parlamentares responsáveis.
          </Text>

          {/* Canais disponíveis */}
          <View style={[styles.channelsRow, { backgroundColor: "#FFF3F3", borderColor: "#FECACA" }]}>
            <View style={styles.channelItem}>
              <Text style={styles.channelIcon}>📱</Text>
              <Text style={[styles.channelLabel, { color: colors.foreground }]}>WhatsApp</Text>
            </View>
            <View style={[styles.channelDivider, { backgroundColor: "#FECACA" }]} />
            <View style={styles.channelItem}>
              <Text style={styles.channelIcon}>📧</Text>
              <Text style={[styles.channelLabel, { color: colors.foreground }]}>E-mail</Text>
            </View>
            <View style={[styles.channelDivider, { backgroundColor: "#FECACA" }]} />
            <View style={styles.channelItem}>
              <Text style={styles.channelIcon}>🐦</Text>
              <Text style={[styles.channelLabel, { color: colors.foreground }]}>Twitter</Text>
            </View>
          </View>

          <View style={styles.tooltipArrowDown} />
          <View style={styles.tooltipActions}>
            <Pressable onPress={skipTour} style={({ pressed }) => [styles.tooltipSkip, { opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[styles.tooltipSkipText, { color: colors.muted }]}>Sair</Text>
            </Pressable>
            <View style={styles.navBtns}>
              <Pressable onPress={() => prevStep()} style={({ pressed }) => [styles.tooltipPrev, { opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[styles.tooltipPrevText, { color: colors.muted }]}>← Anterior</Text>
              </Pressable>
              <Pressable
                onPress={handleSimulatePress}
                style={({ pressed }) => [styles.tooltipNext, { backgroundColor: "#C0392B", opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.tooltipNextText}>Simular Envio 📨</Text>
              </Pressable>
            </View>
          </View>
          <TourProgressBar current={3} total={8} />
        </Animated.View>
      )}
    </>
  );
}

// ─── Tela 5: Participando de Comunidades ────────────────────────────────────

function CommunityChannelsStep() {
  const { nextStep, prevStep, skipTour, communityChannelsLayout } = useTour();
  const colors = useColors();
  const pulse = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [showPost, setShowPost] = React.useState(false);
  const postScale = useRef(new Animated.Value(0.8)).current;
  const postOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSimulatePost = () => {
    setShowPost(true);
    Animated.parallel([
      Animated.spring(postScale, { toValue: 1, useNativeDriver: true, bounciness: 10 }),
      Animated.timing(postOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const spotY = communityChannelsLayout ? communityChannelsLayout.y - 8 : SCREEN_H * 0.35;
  const spotH = communityChannelsLayout ? communityChannelsLayout.height + 16 : 120;

  return (
    <>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.overlayDark, { height: Math.max(0, spotY) }]} />
        <View style={{ height: spotH, backgroundColor: "transparent" }} />
        <View style={[styles.overlayDark, { flex: 1 }]} />
      </View>
      <Animated.View
        pointerEvents="none"
        style={[styles.spotlightBorder, { top: spotY - 4, height: spotH + 8, borderColor: "#7C3AED", transform: [{ scaleX: pulse }] }]}
      />

      {showPost ? (
        <Animated.View
          style={[styles.successCard, { backgroundColor: colors.surface, opacity: postOpacity, transform: [{ scale: postScale }] }]}
        >
          <Text style={styles.successEmoji}>💬</Text>
          <Text style={[styles.successTitle, { color: "#7C3AED" }]}>Mensagem Postada!</Text>
          <Text style={[styles.successBody, { color: colors.foreground }]}>
            Sua mensagem foi publicada no canal da comunidade. Outros membros podem responder e reagir.
          </Text>

          {/* Dicas de interação */}
          <View style={[styles.metricsBox, { backgroundColor: "#F5F3FF", borderColor: "#DDD6FE" }]}>
            <Text style={[styles.metricsTitle, { color: "#7C3AED" }]}>💡 Dicas de Interação</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricIcon}>@</Text>
              <Text style={[styles.metricText, { color: colors.foreground }]}>
                Use <Text style={{ fontWeight: "700" }}>@nome</Text> para chamar a atenção de alguém
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricIcon}>✉️</Text>
              <Text style={[styles.metricText, { color: colors.foreground }]}>
                Clique no <Text style={{ fontWeight: "700" }}>nome do usuário</Text> para enviar mensagem privada
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => nextStep()}
            style={({ pressed }) => [styles.startBtn, { marginTop: 16, backgroundColor: "#7C3AED", opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.startBtnText}>Próximo →</Text>
          </Pressable>
          <ProgressDots current={4} total={8} />
        </Animated.View>
      ) : (
        <Animated.View
          style={[styles.tooltipCard, { backgroundColor: colors.surface, top: spotY + spotH + 16, opacity: fadeIn }]}
        >
          <View style={styles.tooltipArrowUp} />
          <Text style={[styles.tooltipTitle, { color: "#7C3AED" }]}>🏘️ Participando de Comunidades</Text>
          <Text style={[styles.tooltipBody, { color: colors.foreground }]}>
            As comunidades são onde os apoiadores se organizam. Aqui você pode debater estratégias, compartilhar documentos e se conectar com pessoas que lutam pela mesma causa.
          </Text>

          {/* Canais de chat */}
          <View style={[styles.channelsRow, { backgroundColor: "#F5F3FF", borderColor: "#DDD6FE", flexDirection: "column", gap: 6 }]}>
            <View style={[styles.channelItemRow]}>
              <Text style={styles.channelIcon}>#</Text>
              <Text style={[styles.channelLabel, { color: colors.foreground }]}>geral — debate aberto</Text>
            </View>
            <View style={styles.channelItemRow}>
              <Text style={styles.channelIcon}>📋</Text>
              <Text style={[styles.channelLabel, { color: colors.foreground }]}>estratégia — planejamento</Text>
            </View>
            <View style={styles.channelItemRow}>
              <Text style={styles.channelIcon}>📎</Text>
              <Text style={[styles.channelLabel, { color: colors.foreground }]}>documentos — arquivos</Text>
            </View>
          </View>

          <View style={styles.tooltipActions}>
            <Pressable onPress={skipTour} style={({ pressed }) => [styles.tooltipSkip, { opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[styles.tooltipSkipText, { color: colors.muted }]}>Sair</Text>
            </Pressable>
            <View style={styles.navBtns}>
              <Pressable onPress={() => prevStep()} style={({ pressed }) => [styles.tooltipPrev, { opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[styles.tooltipPrevText, { color: colors.muted }]}>← Anterior</Text>
              </Pressable>
              <Pressable
                onPress={handleSimulatePost}
                style={({ pressed }) => [styles.tooltipNext, { backgroundColor: "#7C3AED", opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.tooltipNextText}>Simular Post 💬</Text>
              </Pressable>
            </View>
          </View>
          <TourProgressBar current={4} total={8} />
        </Animated.View>
      )}
    </>
  );
}

// ─── Tela 6: Usando a IA Populus ─────────────────────────────────────────────

function AiPopulusStep() {
  const { nextStep, prevStep, skipTour, aiToolsLayout } = useTour();
  const colors = useColors();
  const pulse = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [showCard, setShowCard] = React.useState(false);
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleGenerateCard = () => {
    setShowCard(true);
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, bounciness: 10 }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const spotY = aiToolsLayout ? aiToolsLayout.y - 8 : SCREEN_H * 0.3;
  const spotH = aiToolsLayout ? aiToolsLayout.height + 16 : 100;

  return (
    <>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.overlayDark, { height: Math.max(0, spotY) }]} />
        <View style={{ height: spotH, backgroundColor: "transparent" }} />
        <View style={[styles.overlayDark, { flex: 1 }]} />
      </View>
      <Animated.View
        pointerEvents="none"
        style={[styles.spotlightBorder, { top: spotY - 4, height: spotH + 8, borderColor: "#0EA5E9", transform: [{ scaleX: pulse }] }]}
      />

      {showCard ? (
        <Animated.View
          style={[styles.successCard, { backgroundColor: colors.surface, opacity: cardOpacity, transform: [{ scale: cardScale }] }]}
        >
          <Text style={styles.successEmoji}>🤖</Text>
          <Text style={[styles.successTitle, { color: "#0EA5E9" }]}>Card Gerado!</Text>
          <Text style={[styles.successBody, { color: colors.foreground }]}>
            Veja como seria um card gerado para sua causa. Pronto para compartilhar!
          </Text>

          {/* Card simulado */}
          <View style={[styles.simulatedCard, { backgroundColor: "#1E3A5F", borderColor: "#2D7D46" }]}>
            <Text style={styles.simulatedCardTitle}>🏗️ Infraestrutura Urbana</Text>
            <Text style={styles.simulatedCardBody}>
              "Buracos nas ruas de SP causam 3.200 acidentes/mês. Apoie o lobby #InfraUrbana e pressione seu vereador agora!"
            </Text>
            <View style={styles.simulatedCardFooter}>
              <Text style={styles.simulatedCardTag}>#Populus</Text>
              <Text style={styles.simulatedCardTag}>#LobbyPopular</Text>
            </View>
          </View>

          <Pressable
            onPress={() => nextStep()}
            style={({ pressed }) => [styles.startBtn, { marginTop: 16, backgroundColor: "#0EA5E9", opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.startBtnText}>Próximo →</Text>
          </Pressable>
          <TourProgressBar current={5} total={8} />
        </Animated.View>
      ) : (
        <Animated.View
          style={[styles.tooltipCard, { backgroundColor: colors.surface, top: spotY + spotH + 16, opacity: fadeIn }]}
        >
          <View style={styles.tooltipArrowUp} />
          <Text style={[styles.tooltipTitle, { color: "#0EA5E9" }]}>🤖 Assistente Populus</Text>
          <Text style={[styles.tooltipBody, { color: colors.foreground }]}>
            Nossa IA está aqui para fortalecer sua causa. Ela pode buscar leis, gerar argumentos, criar cards para redes sociais e calcular o impacto do problema na população.
          </Text>

          {/* Ferramentas da IA */}
          <View style={[styles.aiToolsRow, { backgroundColor: "#F0F9FF", borderColor: "#BAE6FD" }]}>
            <View style={[styles.aiToolBtn, { backgroundColor: "#0EA5E920" }]}>
              <Text style={styles.aiToolIcon}>⚖️</Text>
              <Text style={[styles.aiToolLabel, { color: "#0EA5E9" }]}>Base Legal</Text>
            </View>
            <View style={[styles.aiToolBtn, { backgroundColor: "#0EA5E920" }]}>
              <Text style={styles.aiToolIcon}>💡</Text>
              <Text style={[styles.aiToolLabel, { color: "#0EA5E9" }]}>Argumentos</Text>
            </View>
            <View style={[styles.aiToolBtn, { backgroundColor: "#0EA5E920" }]}>
              <Text style={styles.aiToolIcon}>🖼️</Text>
              <Text style={[styles.aiToolLabel, { color: "#0EA5E9" }]}>Criar Card</Text>
            </View>
          </View>

          <View style={styles.tooltipActions}>
            <Pressable onPress={skipTour} style={({ pressed }) => [styles.tooltipSkip, { opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[styles.tooltipSkipText, { color: colors.muted }]}>Sair</Text>
            </Pressable>
            <View style={styles.navBtns}>
              <Pressable onPress={() => prevStep()} style={({ pressed }) => [styles.tooltipPrev, { opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[styles.tooltipPrevText, { color: colors.muted }]}>← Anterior</Text>
              </Pressable>
              <Pressable
                onPress={handleGenerateCard}
                style={({ pressed }) => [styles.tooltipNext, { backgroundColor: "#0EA5E9", opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.tooltipNextText}>Criar Card 🖼️</Text>
              </Pressable>
            </View>
          </View>
          <TourProgressBar current={5} total={8} />
        </Animated.View>
      )}
    </>
  );
}

// ─── Tela 7: Acompanhando o Impacto no Congresso ─────────────────────────────

function LegislativeTrackingStep() {
  const { nextStep, prevStep, skipTour, legislativeLayout } = useTour();
  const colors = useColors();
  const pulse = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const [showVote, setShowVote] = React.useState(false);
  const voteScale = useRef(new Animated.Value(0.8)).current;
  const voteOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleShowVote = () => {
    setShowVote(true);
    Animated.parallel([
      Animated.spring(voteScale, { toValue: 1, useNativeDriver: true, bounciness: 10 }),
      Animated.timing(voteOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const spotY = legislativeLayout ? legislativeLayout.y - 8 : SCREEN_H * 0.25;
  const spotH = legislativeLayout ? legislativeLayout.height + 16 : 52;

  return (
    <>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.overlayDark, { height: Math.max(0, spotY) }]} />
        <View style={{ height: spotH, backgroundColor: "transparent" }} />
        <View style={[styles.overlayDark, { flex: 1 }]} />
      </View>
      <Animated.View
        pointerEvents="none"
        style={[styles.spotlightBorder, { top: spotY - 4, height: spotH + 8, borderColor: "#1B4F72", transform: [{ scaleX: pulse }] }]}
      />

      {showVote ? (
        <Animated.View
          style={[styles.successCard, { backgroundColor: colors.surface, opacity: voteOpacity, transform: [{ scale: voteScale }] }]}
        >
          <Text style={styles.successEmoji}>📊</Text>
          <Text style={[styles.successTitle, { color: "#1B4F72" }]}>Transparência Total!</Text>
          <Text style={[styles.successBody, { color: colors.foreground }]}>
            Você pode ver como cada parlamentar votou e acompanhar se sua causa virou projeto de lei.
          </Text>

          {/* Exemplo de projeto em tramitação */}
          <View style={[styles.billCard, { backgroundColor: "#EBF5FB", borderColor: "#AED6F1" }]}>
            <View style={styles.billHeader}>
              <View style={[styles.billBadge, { backgroundColor: "#1B4F72" }]}>
                <Text style={styles.billBadgeText}>Câmara</Text>
              </View>
              <View style={[styles.billBadge, { backgroundColor: "#2D7D4620" }]}>
                <Text style={[styles.billBadgeText, { color: "#2D7D46" }]}>Em tramitação</Text>
              </View>
            </View>
            <Text style={[styles.billTitle, { color: "#1B4F72" }]}>PL 1234/2025 — Infraestrutura Urbana</Text>
            <Text style={[styles.billDesc, { color: colors.muted }]}>Obriga municípios a reparar vias em até 30 dias após notificação popular.</Text>
            <View style={styles.voteRow}>
              <Text style={[styles.voteFor, { color: "#2D7D46" }]}>✓ 287 a favor</Text>
              <Text style={[styles.voteAgainst, { color: "#C0392B" }]}>✗ 123 contra</Text>
            </View>
          </View>

          {/* Alerta de notificação */}
          <View style={[styles.metricsBox, { backgroundColor: "#FFF9E6", borderColor: "#FDE68A" }]}>
            <Text style={[styles.metricsTitle, { color: "#B45309" }]}>🔔 Ative as Notificações</Text>
            <Text style={[styles.metricText, { color: colors.foreground }]}>
              Seja avisado quando houver votações importantes sobre causas que você apoia.
            </Text>
          </View>

          <Pressable
            onPress={() => nextStep()}
            style={({ pressed }) => [styles.startBtn, { marginTop: 16, backgroundColor: "#1B4F72", opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.startBtnText}>Próximo →</Text>
          </Pressable>
          <ProgressDots current={6} total={8} />
        </Animated.View>
      ) : (
        <Animated.View
          style={[styles.tooltipCard, { backgroundColor: colors.surface, top: spotY + spotH + 16, opacity: fadeIn }]}
        >
          <View style={styles.tooltipArrowUp} />
          <Text style={[styles.tooltipTitle, { color: "#1B4F72" }]}>📊 Acompanhamento Legislativo</Text>
          <Text style={[styles.tooltipBody, { color: colors.foreground }]}>
            Aqui você vê se sua causa já virou projeto de lei, como estão as votações e como cada parlamentar votou. Transparência total!
          </Text>

          {/* Tabs disponíveis */}
          <View style={[styles.channelsRow, { backgroundColor: "#EBF5FB", borderColor: "#AED6F1", flexDirection: "column", gap: 4 }]}>
            <View style={styles.channelItemRow}>
              <Text style={styles.channelIcon}>📄</Text>
              <Text style={[styles.channelLabel, { color: colors.foreground }]}>Projetos de Lei em tramitação</Text>
            </View>
            <View style={styles.channelItemRow}>
              <Text style={styles.channelIcon}>✅</Text>
              <Text style={[styles.channelLabel, { color: colors.foreground }]}>Votações — como cada deputado votou</Text>
            </View>
            <View style={styles.channelItemRow}>
              <Text style={styles.channelIcon}>👤</Text>
              <Text style={[styles.channelLabel, { color: colors.foreground }]}>Perfil do parlamentar e histórico</Text>
            </View>
          </View>

          <View style={styles.tooltipActions}>
            <Pressable onPress={skipTour} style={({ pressed }) => [styles.tooltipSkip, { opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[styles.tooltipSkipText, { color: colors.muted }]}>Sair</Text>
            </Pressable>
            <View style={styles.navBtns}>
              <Pressable onPress={() => prevStep()} style={({ pressed }) => [styles.tooltipPrev, { opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[styles.tooltipPrevText, { color: colors.muted }]}>← Anterior</Text>
              </Pressable>
              <Pressable
                onPress={handleShowVote}
                style={({ pressed }) => [styles.tooltipNext, { backgroundColor: "#1B4F72", opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.tooltipNextText}>Ver Votação 📊</Text>
              </Pressable>
            </View>
          </View>
          <TourProgressBar current={6} total={8} />
        </Animated.View>
      )}
    </>
  );
}

// ─── Tela 8: Conclusão ───────────────────────────────────────────────────────

const FEATURE_SUMMARY = [
  { icon: "🔍", label: "Descubra causas perto de você" },
  { icon: "🤝", label: "Apoie e mobilize cidadãos" },
  { icon: "📢", label: "Pressione parlamentares" },
  { icon: "💬", label: "Participe de comunidades" },
  { icon: "🤖", label: "Use IA para fortalecer" },
  { icon: "📊", label: "Acompanhe o impacto" },
];

function TourCompleteStep() {
  const { completeTour } = useTour();
  const colors = useColors();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleIn, { toValue: 1, useNativeDriver: true, bounciness: 8 }),
    ]).start();
  }, []);

  return (
    <View style={styles.welcomeOverlay}>
      <Animated.View
        style={[
          styles.completeCard,
          { backgroundColor: colors.surface, opacity: fadeIn, transform: [{ scale: scaleIn }] },
        ]}
      >
        {/* Cabeçalho */}
        <Text style={styles.completeEmoji}>🎉</Text>
        <Text style={[styles.completeTitle, { color: "#1E3A5F" }]}>Parabéns!</Text>
        <Text style={[styles.completeSubtitle, { color: colors.muted }]}>
          Você já sabe como usar o Populus para fazer sua voz chegar ao Congresso.
        </Text>

        {/* Resumo visual */}
        <View style={[styles.featureGrid, { borderColor: colors.border }]}>
          {FEATURE_SUMMARY.map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={[styles.featureLabel, { color: colors.foreground }]}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Botões de ação */}
        <Pressable
          onPress={() => {
            completeTour();
            router.replace("/(tabs)");
          }}
          style={({ pressed }) => [styles.startBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.startBtnText}>Ir para o Feed 🏠</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            completeTour();
            router.push("/(tabs)/create");
          }}
          style={({ pressed }) => [styles.createLobbyBtn, { borderColor: "#2D7D46", opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[styles.createLobbyBtnText, { color: "#2D7D46" }]}>Criar meu Primeiro Lobby ✊</Text>
        </Pressable>

        <Pressable
          onPress={() => completeTour()}
          style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.skipBtnText, { color: colors.muted }]}>Ver Tutorial Completo</Text>
        </Pressable>

        <ProgressDots current={7} total={8} />
      </Animated.View>
    </View>
  );
}

// ─── Componente Principal ────────────────────────────────────────────────────

export function TourGuide() {
  const { isTourActive, currentStep } = useTour();

  if (!isTourActive) return null;

  if (currentStep === "welcome") {
    return (
      <Modal transparent animationType="fade" visible statusBarTranslucent>
        <View style={styles.welcomeOverlay}>
          <WelcomeStep />
        </View>
      </Modal>
    );
  }

  if (currentStep === "tour_complete") {
    return (
      <Modal transparent animationType="fade" visible statusBarTranslucent>
        <View style={styles.welcomeOverlay}>
          <TourCompleteStep />
        </View>
      </Modal>
    );
  }

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {currentStep === "explore_filters" && <ExploreFiltersStep />}
        {currentStep === "support_lobby" && <SupportLobbyStep />}
        {currentStep === "press_action" && <PressActionStep />}
        {currentStep === "community_channels" && <CommunityChannelsStep />}
        {currentStep === "ai_populus" && <AiPopulusStep />}
        {currentStep === "legislative_tracking" && <LegislativeTrackingStep />}
      </View>
    </Modal>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Welcome
  welcomeOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  welcomeCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  illustrationRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 4,
    gap: 12,
  },
  citizenBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  citizenBubbleCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  citizenEmoji: {
    fontSize: 32,
  },
  connectorRow: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 20,
  },
  connector: {
    width: 32,
    height: 3,
    borderRadius: 2,
    opacity: 0.5,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  welcomeTime: {
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 24,
  },
  startBtn: {
    backgroundColor: "#2D7D46",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
  },
  startBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  skipBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 14,
  },
  progressBarContainer: {
    width: "100%",
    marginTop: 16,
    gap: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: "#687076",
    textAlign: "center",
    fontWeight: "600",
  },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: "#1E3A5F",
    borderRadius: 2,
  },
  navBtns: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  tooltipPrev: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  tooltipPrevText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Overlay
  overlayDark: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  spotlightBorder: {
    position: "absolute",
    left: 12,
    right: 12,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: "#1E3A5F",
    borderStyle: "dashed",
  },

  // Tooltip
  tooltipCard: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  tooltipArrowUp: {
    position: "absolute",
    top: -10,
    left: 40,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFFFFF",
  },
  tooltipArrowDown: {
    position: "absolute",
    bottom: -10,
    left: 40,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
  },
  tooltipTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  tooltipBody: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  exampleBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  exampleText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  tooltipActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  tooltipSkip: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tooltipSkipText: {
    fontSize: 14,
  },
  tooltipNext: {
    backgroundColor: "#1E3A5F",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  tooltipNextText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Success / Simulation cards
  successCard: {
    position: "absolute",
    left: 24,
    right: 24,
    top: "50%",
    marginTop: -200,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  successEmoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  successBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 14,
  },
  counterRow: {
    flexDirection: "row",
    gap: 16,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  counterText: {
    fontSize: 15,
    fontWeight: "700",
  },
  counterPoints: {
    fontSize: 15,
    fontWeight: "700",
  },

  // Channels row
  channelsRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
  },
  channelItem: {
    alignItems: "center",
    gap: 4,
  },
  channelItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  channelDivider: {
    width: 1,
    height: 32,
  },
  channelIcon: {
    fontSize: 22,
  },
  channelLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Metrics / info box
  metricsBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 4,
    width: "100%",
  },
  metricsTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  metricIcon: {
    fontSize: 16,
    lineHeight: 20,
  },
  metricText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },

  // AI tools
  aiToolsRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    gap: 8,
    justifyContent: "space-around",
    width: "100%",
  },
  aiToolBtn: {
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 10,
    gap: 4,
  },
  aiToolIcon: {
    fontSize: 22,
  },
  aiToolLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },

  // Simulated social card
  simulatedCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 4,
    width: "100%",
  },
  simulatedCardTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  simulatedCardBody: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  simulatedCardFooter: {
    flexDirection: "row",
    gap: 8,
  },
  simulatedCardTag: {
    color: "#2D7D46",
    fontSize: 12,
    fontWeight: "700",
  },

  // Tela 7: Legislative tracking
  billCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    width: "100%",
  },
  billHeader: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  billBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  billBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  billTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  billDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  voteRow: {
    flexDirection: "row",
    gap: 16,
  },
  voteFor: {
    fontSize: 13,
    fontWeight: "700",
  },
  voteAgainst: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Tela 8: Conclusão
  completeCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  completeEmoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  completeTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
  },
  completeSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  featureGrid: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureIcon: {
    fontSize: 20,
    width: 28,
    textAlign: "center",
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  createLobbyBtn: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 10,
  },
  createLobbyBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
