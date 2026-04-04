import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useColors } from "@/hooks/use-colors";

const { width: SCREEN_W } = Dimensions.get("window");

type Tab = "animations" | "simulators" | "cases";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "animations", label: "Animações", icon: "🎬" },
  { id: "simulators", label: "Simuladores", icon: "🎮" },
  { id: "cases", label: "Casos Reais", icon: "📖" },
];

// ─── Video Placeholder ────────────────────────────────────────────────────────

function VideoPlaceholder({
  title,
  duration,
  emoji,
  color,
  onPlay,
}: {
  title: string;
  duration: string;
  emoji: string;
  color: string;
  onPlay: () => void;
}) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Pressable
      onPress={onPlay}
      style={({ pressed }) => [styles.videoCard, { backgroundColor: color + "18", borderColor: color + "40", opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={[styles.videoThumb, { backgroundColor: color + "22" }]}>
        <Text style={styles.videoEmoji}>{emoji}</Text>
        <Animated.View style={[styles.playBtn, { backgroundColor: color, transform: [{ scale: pulse }] }]}>
          <Text style={styles.playBtnText}>▶</Text>
        </Animated.View>
      </View>
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.videoDuration, { color: colors.muted }]}>⏱ {duration}</Text>
      </View>
    </Pressable>
  );
}

// ─── Animation: Pressure Flow ─────────────────────────────────────────────────

function PressureFlowAnimation() {
  const colors = useColors();
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const arrowOpacity = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  const nodeScale = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(0.7)).current,
    useRef(new Animated.Value(0.7)).current,
    useRef(new Animated.Value(0.7)).current,
  ];

  const NODES = [
    { icon: "👤", label: "Cidadão", color: "#2D7D46" },
    { icon: "📱", label: "App", color: "#1E3A5F" },
    { icon: "🏛️", label: "Parlamentar", color: "#C0392B" },
    { icon: "⚖️", label: "Votação", color: "#B45309" },
  ];

  const runAnimation = useCallback(() => {
    if (running) return;
    setRunning(true);
    setStep(0);
    arrowOpacity.forEach((a) => a.setValue(0));
    nodeScale.forEach((n, i) => n.setValue(i === 0 ? 1 : 0.7));

    const seq: Animated.CompositeAnimation[] = [];
    for (let i = 0; i < 3; i++) {
      seq.push(
        Animated.parallel([
          Animated.timing(arrowOpacity[i], { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(nodeScale[i + 1], { toValue: 1, useNativeDriver: true, bounciness: 12 }),
        ])
      );
    }
    Animated.sequence(seq).start(() => {
      setStep(4);
      setRunning(false);
    });
  }, [running]);

  return (
    <View style={[styles.animCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.animTitle, { color: colors.foreground }]}>
        🏛️ Como a pressão chega ao Congresso
      </Text>
      <Text style={[styles.animDesc, { color: colors.muted }]}>
        Cada mensagem enviada pelo app chega diretamente ao gabinete do parlamentar.
      </Text>

      <View style={styles.flowRow}>
        {NODES.map((node, i) => (
          <React.Fragment key={node.label}>
            <Animated.View style={[styles.flowNode, { transform: [{ scale: nodeScale[i] }] }]}>
              <View style={[styles.flowNodeCircle, { backgroundColor: node.color + "20", borderColor: node.color }]}>
                <Text style={styles.flowNodeIcon}>{node.icon}</Text>
              </View>
              <Text style={[styles.flowNodeLabel, { color: colors.foreground }]}>{node.label}</Text>
            </Animated.View>
            {i < 3 && (
              <Animated.View style={[styles.flowArrow, { opacity: arrowOpacity[i] }]}>
                <Text style={[styles.flowArrowText, { color: NODES[i].color }]}>→</Text>
              </Animated.View>
            )}
          </React.Fragment>
        ))}
      </View>

      {step === 4 && (
        <View style={[styles.successBadge, { backgroundColor: "#2D7D4620", borderColor: "#2D7D46" }]}>
          <Text style={[styles.successBadgeText, { color: "#2D7D46" }]}>
            ✓ Mensagem entregue ao gabinete!
          </Text>
        </View>
      )}

      <Pressable
        onPress={runAnimation}
        style={({ pressed }) => [styles.animBtn, { backgroundColor: "#1E3A5F", opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.animBtnText}>{running ? "Enviando..." : step === 4 ? "▶ Repetir" : "▶ Ver Animação"}</Text>
      </Pressable>
    </View>
  );
}

// ─── Animation: Campaign Cycle ────────────────────────────────────────────────

function CampaignCycleAnimation() {
  const colors = useColors();
  const [activeStep, setActiveStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const STEPS = [
    { icon: "🚨", label: "Problema", color: "#C0392B" },
    { icon: "📣", label: "Mobilização", color: "#E67E22" },
    { icon: "💬", label: "Pressão", color: "#F39C12" },
    { icon: "📄", label: "Projeto", color: "#2980B9" },
    { icon: "⚖️", label: "Lei", color: "#2D7D46" },
  ];

  const runCycle = useCallback(() => {
    if (running) return;
    setRunning(true);
    setActiveStep(-1);
    rotateAnim.setValue(0);

    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 2500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    let i = 0;
    const interval = setInterval(() => {
      setActiveStep(i);
      i++;
      if (i >= STEPS.length) {
        clearInterval(interval);
        setRunning(false);
      }
    }, 500);
  }, [running]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={[styles.animCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.animTitle, { color: colors.foreground }]}>
        🔄 Ciclo da Campanha Popular
      </Text>
      <Text style={[styles.animDesc, { color: colors.muted }]}>
        Do problema identificado até a lei aprovada — veja cada etapa do processo.
      </Text>

      <View style={styles.cycleContainer}>
        <Animated.View style={[styles.cycleRing, { borderColor: colors.border, transform: [{ rotate }] }]}>
          <Text style={styles.cycleRingIcon}>⚙️</Text>
        </Animated.View>
        <View style={styles.cycleSteps}>
          {STEPS.map((s, i) => (
            <View
              key={s.label}
              style={[
                styles.cycleStep,
                activeStep >= i && { backgroundColor: s.color + "18", borderColor: s.color },
                activeStep >= i && styles.cycleStepActive,
              ]}
            >
              <Text style={styles.cycleStepIcon}>{s.icon}</Text>
              <Text style={[styles.cycleStepLabel, { color: activeStep >= i ? s.color : colors.muted }]}>
                {s.label}
              </Text>
              {activeStep >= i && <Text style={[styles.cycleCheck, { color: s.color }]}>✓</Text>}
            </View>
          ))}
        </View>
      </View>

      <Pressable
        onPress={runCycle}
        style={({ pressed }) => [styles.animBtn, { backgroundColor: "#2D7D46", opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.animBtnText}>{running ? "Processando..." : activeStep === 4 ? "▶ Repetir" : "▶ Ver Ciclo"}</Text>
      </Pressable>
    </View>
  );
}

// ─── Animation: Heat Map ──────────────────────────────────────────────────────

function HeatMapAnimation() {
  const colors = useColors();
  const [dots, setDots] = useState<{ x: number; y: number; opacity: Animated.Value; scale: Animated.Value }[]>([]);
  const [running, setRunning] = useState(false);
  const [total, setTotal] = useState(0);

  const CITIES = [
    { x: 0.35, y: 0.45 }, // SP
    { x: 0.38, y: 0.38 }, // RJ
    { x: 0.55, y: 0.25 }, // BA
    { x: 0.65, y: 0.18 }, // PE
    { x: 0.38, y: 0.55 }, // PR
    { x: 0.35, y: 0.62 }, // RS
    { x: 0.42, y: 0.32 }, // MG
    { x: 0.28, y: 0.42 }, // MT
    { x: 0.22, y: 0.28 }, // AM
    { x: 0.52, y: 0.12 }, // CE
  ];

  const runHeatMap = useCallback(() => {
    if (running) return;
    setRunning(true);
    setDots([]);
    setTotal(0);

    const MAP_W = Math.min(SCREEN_W - 80, 300);
    const MAP_H = MAP_W * 0.8;

    let count = 0;
    const interval = setInterval(() => {
      const city = CITIES[count % CITIES.length];
      const spread = (Math.random() - 0.5) * 0.06;
      const opacity = new Animated.Value(0);
      const scale = new Animated.Value(0.3);
      const newDot = {
        x: (city.x + spread) * MAP_W,
        y: (city.y + spread) * MAP_H,
        opacity,
        scale,
      };
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0.85, duration: 400, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 8 }),
      ]).start();
      setDots((prev) => [...prev, newDot]);
      setTotal((t) => t + Math.floor(Math.random() * 200 + 50));
      count++;
      if (count >= 20) {
        clearInterval(interval);
        setRunning(false);
      }
    }, 200);
  }, [running]);

  const MAP_W = Math.min(SCREEN_W - 80, 300);
  const MAP_H = MAP_W * 0.8;

  return (
    <View style={[styles.animCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.animTitle, { color: colors.foreground }]}>
        🗺️ Mapa de Calor dos Apoios
      </Text>
      <Text style={[styles.animDesc, { color: colors.muted }]}>
        Veja como os apoios se espalham pelo Brasil em tempo real.
      </Text>

      <View style={[styles.mapContainer, { width: MAP_W, height: MAP_H, backgroundColor: "#EBF5FB", borderColor: "#AED6F1" }]}>
        <Text style={styles.mapBrazilIcon}>🇧🇷</Text>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.heatDot,
              {
                left: dot.x - 8,
                top: dot.y - 8,
                opacity: dot.opacity,
                transform: [{ scale: dot.scale }],
                backgroundColor: i % 3 === 0 ? "#C0392B" : i % 3 === 1 ? "#E67E22" : "#2D7D46",
              },
            ]}
          />
        ))}
        {total > 0 && (
          <View style={styles.mapCounter}>
            <Text style={styles.mapCounterText}>{total.toLocaleString()} apoios</Text>
          </View>
        )}
      </View>

      <Pressable
        onPress={runHeatMap}
        style={({ pressed }) => [styles.animBtn, { backgroundColor: "#C0392B", opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.animBtnText}>{running ? "Espalhando..." : dots.length > 0 ? "▶ Repetir" : "▶ Ver Mapa"}</Text>
      </Pressable>
    </View>
  );
}

// ─── Simulator: Pressure ──────────────────────────────────────────────────────

function PressureSimulator() {
  const colors = useColors();
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const countAnim = useRef(new Animated.Value(1)).current;

  const CHANNELS = [
    { icon: "💬", label: "WhatsApp", color: "#25D366" },
    { icon: "📧", label: "E-mail", color: "#1E3A5F" },
    { icon: "🐦", label: "Twitter", color: "#1DA1F2" },
  ];

  const [activeChannels, setActiveChannels] = useState<number[]>([]);

  const runSimulation = useCallback(() => {
    if (running) return;
    setRunning(true);
    setDone(false);
    setCount(0);
    setActiveChannels([]);

    let c = 0;
    const interval = setInterval(() => {
      c += Math.floor(Math.random() * 3 + 1);
      setCount(c);
      setActiveChannels([Math.floor(Math.random() * 3)]);
      Animated.sequence([
        Animated.timing(countAnim, { toValue: 1.2, duration: 80, useNativeDriver: true }),
        Animated.timing(countAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
      if (c >= 25) {
        clearInterval(interval);
        setRunning(false);
        setDone(true);
        setActiveChannels([]);
      }
    }, 150);
  }, [running]);

  return (
    <View style={[styles.simCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.simTitle, { color: colors.foreground }]}>📣 Simulador de Pressão</Text>
      <Text style={[styles.simDesc, { color: colors.muted }]}>
        Clique em "Pressionar" e veja as mensagens sendo enviadas aos parlamentares.
      </Text>

      {/* Counter */}
      <Animated.View style={[styles.pressureCounter, { backgroundColor: "#C0392B18", transform: [{ scale: countAnim }] }]}>
        <Text style={[styles.pressureCounterNum, { color: "#C0392B" }]}>{count}</Text>
        <Text style={[styles.pressureCounterLabel, { color: colors.muted }]}>mensagens enviadas</Text>
      </Animated.View>

      {/* Channels */}
      <View style={styles.channelRow}>
        {CHANNELS.map((ch, i) => (
          <View
            key={ch.label}
            style={[
              styles.channelChip,
              { borderColor: ch.color + "40", backgroundColor: activeChannels.includes(i) ? ch.color + "20" : "transparent" },
            ]}
          >
            <Text style={styles.channelChipIcon}>{ch.icon}</Text>
            <Text style={[styles.channelChipLabel, { color: activeChannels.includes(i) ? ch.color : colors.muted }]}>
              {ch.label}
            </Text>
            {activeChannels.includes(i) && <Text style={{ color: ch.color, fontSize: 10 }}>●</Text>}
          </View>
        ))}
      </View>

      {done && (
        <View style={[styles.simResult, { backgroundColor: "#2D7D4618", borderColor: "#2D7D46" }]}>
          <Text style={[styles.simResultText, { color: "#2D7D46" }]}>
            ✓ Pronto! Sua mensagem foi enviada (modo tutorial). Na vida real, isso chegaria direto ao gabinete do deputado.
          </Text>
        </View>
      )}

      <Pressable
        onPress={runSimulation}
        style={({ pressed }) => [styles.simBtn, { backgroundColor: "#C0392B", opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.simBtnText}>{running ? "Enviando..." : done ? "▶ Repetir" : "📣 Pressionar Agora"}</Text>
      </Pressable>
    </View>
  );
}

// ─── Simulator: Goal ──────────────────────────────────────────────────────────

function GoalSimulator() {
  const colors = useColors();
  const [value, setValue] = useState(0);
  const barWidth = useRef(new Animated.Value(0)).current;

  const MILESTONES = [
    { threshold: 100, icon: "📰", label: "Cobertura na imprensa local" },
    { threshold: 500, icon: "🏛️", label: "Reunião com vereador" },
    { threshold: 1000, icon: "🎤", label: "Audiência pública garantida" },
    { threshold: 5000, icon: "📄", label: "Projeto de lei apresentado" },
    { threshold: 10000, icon: "⚖️", label: "Projeto pode virar lei" },
  ];

  const MAX = 10000;

  const handleSlide = useCallback((v: number) => {
    setValue(v);
    Animated.timing(barWidth, {
      toValue: v / MAX,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, []);

  const BAR_W = Math.min(SCREEN_W - 80, 280);
  const unlockedMilestones = MILESTONES.filter((m) => value >= m.threshold);

  return (
    <View style={[styles.simCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.simTitle, { color: colors.foreground }]}>🎯 Simulador de Meta</Text>
      <Text style={[styles.simDesc, { color: colors.muted }]}>
        Arraste para ver o que cada meta de apoios conquista para sua campanha.
      </Text>

      {/* Value display */}
      <Text style={[styles.goalValue, { color: "#1E3A5F" }]}>
        {value.toLocaleString()} apoios
      </Text>

      {/* Progress bar */}
      <View style={[styles.goalBarTrack, { width: BAR_W, backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.goalBarFill,
            {
              width: barWidth.interpolate({ inputRange: [0, 1], outputRange: [0, BAR_W] }),
              backgroundColor: value >= 10000 ? "#2D7D46" : value >= 1000 ? "#1E3A5F" : "#E67E22",
            },
          ]}
        />
        {MILESTONES.map((m) => (
          <View
            key={m.threshold}
            style={[
              styles.goalMilestoneMarker,
              { left: (m.threshold / MAX) * BAR_W - 1, backgroundColor: value >= m.threshold ? "#2D7D46" : colors.muted },
            ]}
          />
        ))}
      </View>

      {/* Slider buttons */}
      <View style={styles.sliderBtns}>
        {[0, 100, 500, 1000, 5000, 10000].map((v) => (
          <Pressable
            key={v}
            onPress={() => handleSlide(v)}
            style={({ pressed }) => [
              styles.sliderBtn,
              { backgroundColor: value === v ? "#1E3A5F" : colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.sliderBtnText, { color: value === v ? "#fff" : colors.muted }]}>
              {v >= 1000 ? `${v / 1000}k` : v === 0 ? "0" : v.toString()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Unlocked milestones */}
      {unlockedMilestones.length > 0 && (
        <View style={styles.milestonesBox}>
          {unlockedMilestones.map((m) => (
            <View key={m.threshold} style={[styles.milestoneItem, { backgroundColor: "#2D7D4610", borderColor: "#2D7D4640" }]}>
              <Text style={styles.milestoneIcon}>{m.icon}</Text>
              <Text style={[styles.milestoneLabel, { color: "#2D7D46" }]}>{m.label}</Text>
              <Text style={{ color: "#2D7D46", fontSize: 12 }}>✓</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Simulator: Impact ────────────────────────────────────────────────────────

function ImpactSimulator() {
  const colors = useColors();
  const [residents, setResidents] = useState(5000);
  const [affected, setAffected] = useState(30);

  const impactedPeople = Math.round((residents * affected) / 100);
  const estimatedSavings = Math.round(impactedPeople * 1200);
  const petitionStrength = Math.min(100, Math.round((impactedPeople / 50000) * 100));

  const RESIDENT_OPTIONS = [1000, 5000, 10000, 50000, 100000];
  const AFFECTED_OPTIONS = [10, 30, 50, 70, 90];

  return (
    <View style={[styles.simCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.simTitle, { color: colors.foreground }]}>📊 Simulador de Impacto</Text>
      <Text style={[styles.simDesc, { color: colors.muted }]}>
        Ajuste as variáveis e veja o impacto estimado da sua campanha.
      </Text>

      {/* Residents */}
      <View style={styles.impactRow}>
        <Text style={[styles.impactLabel, { color: colors.foreground }]}>👥 Moradores da região:</Text>
        <View style={styles.impactBtns}>
          {RESIDENT_OPTIONS.map((v) => (
            <Pressable
              key={v}
              onPress={() => setResidents(v)}
              style={({ pressed }) => [
                styles.impactBtn,
                { backgroundColor: residents === v ? "#1E3A5F" : colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[styles.impactBtnText, { color: residents === v ? "#fff" : colors.muted }]}>
                {v >= 1000 ? `${v / 1000}k` : v.toString()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Affected */}
      <View style={styles.impactRow}>
        <Text style={[styles.impactLabel, { color: colors.foreground }]}>⚠️ % afetados pelo problema:</Text>
        <View style={styles.impactBtns}>
          {AFFECTED_OPTIONS.map((v) => (
            <Pressable
              key={v}
              onPress={() => setAffected(v)}
              style={({ pressed }) => [
                styles.impactBtn,
                { backgroundColor: affected === v ? "#C0392B" : colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[styles.impactBtnText, { color: affected === v ? "#fff" : colors.muted }]}>
                {v}%
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Results */}
      <View style={[styles.impactResults, { backgroundColor: "#EBF5FB", borderColor: "#AED6F1" }]}>
        <View style={styles.impactResultItem}>
          <Text style={[styles.impactResultNum, { color: "#1E3A5F" }]}>{impactedPeople.toLocaleString()}</Text>
          <Text style={[styles.impactResultLabel, { color: colors.muted }]}>pessoas afetadas</Text>
        </View>
        <View style={[styles.impactDivider, { backgroundColor: colors.border }]} />
        <View style={styles.impactResultItem}>
          <Text style={[styles.impactResultNum, { color: "#2D7D46" }]}>R$ {(estimatedSavings / 1000).toFixed(0)}k</Text>
          <Text style={[styles.impactResultLabel, { color: colors.muted }]}>economia estimada/ano</Text>
        </View>
        <View style={[styles.impactDivider, { backgroundColor: colors.border }]} />
        <View style={styles.impactResultItem}>
          <Text style={[styles.impactResultNum, { color: "#E67E22" }]}>{petitionStrength}%</Text>
          <Text style={[styles.impactResultLabel, { color: colors.muted }]}>força da petição</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Case Study ───────────────────────────────────────────────────────────────

function CaseStudy({
  title,
  subtitle,
  emoji,
  color,
  steps,
  result,
}: {
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  steps: { icon: string; text: string }[];
  result: string;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const heightAnim = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    if (!expanded) {
      setExpanded(true);
      setVisibleSteps(0);
      Animated.timing(heightAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setVisibleSteps(i);
        if (i >= steps.length) clearInterval(interval);
      }, 300);
    } else {
      Animated.timing(heightAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
        setExpanded(false);
        setVisibleSteps(0);
      });
    }
  }, [expanded, steps.length]);

  return (
    <View style={[styles.caseCard, { backgroundColor: colors.surface, borderColor: color + "40" }]}>
      {/* Header */}
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.caseHeader, { opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={[styles.caseEmojiCircle, { backgroundColor: color + "18" }]}>
          <Text style={styles.caseEmoji}>{emoji}</Text>
        </View>
        <View style={styles.caseTitleBlock}>
          <Text style={[styles.caseTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.caseSubtitle, { color: colors.muted }]}>{subtitle}</Text>
        </View>
        <Text style={[styles.caseChevron, { color: colors.muted }]}>{expanded ? "▲" : "▼"}</Text>
      </Pressable>

      {/* Steps */}
      {expanded && (
        <View style={styles.caseSteps}>
          {steps.slice(0, visibleSteps).map((s, i) => (
            <View key={i} style={styles.caseStep}>
              <View style={[styles.caseStepNum, { backgroundColor: color }]}>
                <Text style={styles.caseStepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.caseStepIcon}>{s.icon}</Text>
              <Text style={[styles.caseStepText, { color: colors.foreground }]}>{s.text}</Text>
            </View>
          ))}
          {visibleSteps >= steps.length && (
            <View style={[styles.caseResult, { backgroundColor: color + "18", borderColor: color }]}>
              <Text style={[styles.caseResultText, { color }]}>🏆 {result}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HowItWorksScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<Tab>("animations");

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1E3A5F" }]}>
        <BackButton onPress={() => router.back()} label="Voltar" variant="dark" />
        <Text style={styles.headerTitle}>Como Funciona</Text>
        <Text style={styles.headerSubtitle}>Aprenda de forma interativa</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={({ pressed }) => [
              styles.tabBtn,
              activeTab === tab.id && [styles.tabBtnActive, { borderBottomColor: "#1E3A5F" }],
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, { color: activeTab === tab.id ? "#1E3A5F" : colors.muted }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "animations" && (
          <>
            <VideoPlaceholder
              title="Introdução ao Populus"
              duration="45 seg"
              emoji="🎬"
              color="#1E3A5F"
              onPlay={() => {}}
            />
            <VideoPlaceholder
              title="Como criar sua primeira campanha"
              duration="60 seg"
              emoji="📋"
              color="#2D7D46"
              onPlay={() => {}}
            />
            <VideoPlaceholder
              title="Pressionando parlamentares"
              duration="30 seg"
              emoji="📣"
              color="#C0392B"
              onPlay={() => {}}
            />
            <PressureFlowAnimation />
            <CampaignCycleAnimation />
            <HeatMapAnimation />
          </>
        )}

        {activeTab === "simulators" && (
          <>
            <PressureSimulator />
            <GoalSimulator />
            <ImpactSimulator />
          </>
        )}

        {activeTab === "cases" && (
          <>
            <Text style={[styles.casesIntro, { color: colors.muted }]}>
              Veja como cidadãos reais usaram o Populus para transformar problemas em soluções concretas.
            </Text>
            <CaseStudy
              title="Lobby da Iluminação"
              subtitle="Bairro sem iluminação → Poste instalado em 4 meses"
              emoji="💡"
              color="#F39C12"
              steps={[
                { icon: "📸", text: "Tirou foto do poste quebrado" },
                { icon: "📋", text: "Criou campanha com categoria \"Infraestrutura\"" },
                { icon: "📍", text: "Marcou a localização no mapa" },
                { icon: "🤖", text: "A IA sugeriu o Art. 6º da CF (direito à segurança)" },
                { icon: "👥", text: "Em 2 semanas, 300 vizinhos apoiaram" },
                { icon: "📣", text: "Ativaram pressão para o vereador" },
                { icon: "💰", text: "Vereador destinou emenda" },
                { icon: "✅", text: "Poste instalado em 4 meses" },
              ]}
              result="Problema resolvido em 4 meses com 300 apoiadores"
            />
            <CaseStudy
              title="Lobby da Merenda Escolar"
              subtitle="Minas Gerais → Projeto de lei na Assembleia"
              emoji="🍎"
              color="#2D7D46"
              steps={[
                { icon: "📋", text: "Criou campanha estadual" },
                { icon: "🤖", text: "IA buscou dados: \"30% das escolas têm merenda inadequada\"" },
                { icon: "🖼️", text: "Gerou cards para WhatsApp" },
                { icon: "👩‍👧", text: "Comunidade cresceu para 5.000 mães" },
                { icon: "📣", text: "Pressionaram deputados estaduais" },
                { icon: "⚖️", text: "Projeto de lei apresentado na Assembleia" },
              ]}
              result="5.000 apoiadores → Projeto de lei na Assembleia"
            />
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backBtn: {
    marginBottom: 8,
  },
  backBtnText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    gap: 2,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomWidth: 2,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  // Video placeholder
  videoCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  videoThumb: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
  },
  videoEmoji: {
    fontSize: 40,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  playBtnText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 3,
  },
  videoInfo: {
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  videoDuration: {
    fontSize: 12,
  },
  // Animation cards
  animCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  animTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  animDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  animBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  animBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  successBadge: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
    alignItems: "center",
  },
  successBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  // Pressure flow
  flowRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  flowNode: {
    alignItems: "center",
    gap: 6,
  },
  flowNodeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  flowNodeIcon: {
    fontSize: 22,
  },
  flowNodeLabel: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  flowArrow: {
    marginBottom: 16,
  },
  flowArrowText: {
    fontSize: 20,
    fontWeight: "700",
  },
  // Campaign cycle
  cycleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  cycleRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  cycleRingIcon: {
    fontSize: 22,
  },
  cycleSteps: {
    flex: 1,
    gap: 6,
  },
  cycleStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  cycleStepActive: {
    borderWidth: 1,
  },
  cycleStepIcon: {
    fontSize: 16,
  },
  cycleStepLabel: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  cycleCheck: {
    fontSize: 14,
    fontWeight: "700",
  },
  // Heat map
  mapContainer: {
    alignSelf: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  mapBrazilIcon: {
    fontSize: 64,
    opacity: 0.3,
  },
  heatDot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  mapCounter: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mapCounterText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  // Simulators
  simCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  simTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  simDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  simBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 12,
  },
  simBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  simResult: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  simResultText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  // Pressure counter
  pressureCounter: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  pressureCounterNum: {
    fontSize: 52,
    fontWeight: "800",
    lineHeight: 60,
  },
  pressureCounterLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  channelRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  channelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  channelChipIcon: {
    fontSize: 14,
  },
  channelChipLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Goal simulator
  goalValue: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  goalBarTrack: {
    height: 10,
    borderRadius: 5,
    alignSelf: "center",
    overflow: "visible",
    marginBottom: 12,
    position: "relative",
  },
  goalBarFill: {
    height: 10,
    borderRadius: 5,
    position: "absolute",
    left: 0,
    top: 0,
  },
  goalMilestoneMarker: {
    position: "absolute",
    top: -3,
    width: 2,
    height: 16,
    borderRadius: 1,
  },
  sliderBtns: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  sliderBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sliderBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  milestonesBox: {
    gap: 6,
  },
  milestoneItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  milestoneIcon: {
    fontSize: 16,
  },
  milestoneLabel: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  // Impact simulator
  impactRow: {
    marginBottom: 12,
  },
  impactLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  impactBtns: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  impactBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  impactBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  impactResults: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  impactResultItem: {
    alignItems: "center",
  },
  impactResultNum: {
    fontSize: 18,
    fontWeight: "800",
  },
  impactResultLabel: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },
  impactDivider: {
    width: 1,
    height: 36,
  },
  // Case studies
  casesIntro: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 4,
  },
  caseCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  caseHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  caseEmojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  caseEmoji: {
    fontSize: 24,
  },
  caseTitleBlock: {
    flex: 1,
  },
  caseTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  caseSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  caseChevron: {
    fontSize: 14,
  },
  caseSteps: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  caseStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  caseStepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  caseStepNumText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  caseStepIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  caseStepText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  caseResult: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  caseResultText: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
