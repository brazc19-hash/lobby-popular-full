import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  Share,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTour } from "@/contexts/tour-context";
import { ContextualTooltip } from "@/components/contextual-tooltip";

const PRESSURE_CHANNELS = [
  {
    key: "whatsapp" as const,
    label: "WhatsApp",
    icon: "message.fill" as const,
    color: "#25D366",
    description: "Enviar mensagem ao gabinete",
  },
  {
    key: "email" as const,
    label: "E-mail",
    icon: "envelope.fill" as const,
    color: "#EA4335",
    description: "Enviar e-mail institucional",
  },
  {
    key: "twitter" as const,
    label: "Twitter/X",
    icon: "paperplane.fill" as const,
    color: "#1DA1F2",
    description: "Publicar com hashtag",
  },
  {
    key: "phone" as const,
    label: "Telefone",
    icon: "phone.fill" as const,
    color: "#34C759",
    description: "Ligar com roteiro pronto",
  },
  {
    key: "copy" as const,
    label: "Copiar Link",
    icon: "doc.on.doc.fill" as const,
    color: "#8E8E93",
    description: "Compartilhar nas redes",
  },
];

const SMART_MILESTONES_DISPLAY = [
  { count: 500, label: "Ofício ao vereador", icon: "doc.text.fill" as const, color: "#3498DB" },
  { count: 1000, label: "Audiência pública", icon: "person.3.fill" as const, color: "#27AE60" },
  { count: 5000, label: "Indicação formal", icon: "star.fill" as const, color: "#F39C12" },
  { count: 10000, label: "Projeto de lei", icon: "building.columns.fill" as const, color: "#8E44AD" },
  { count: 50000, label: "Mobilização nacional", icon: "globe" as const, color: "#C0392B" },
];

export default function PressureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lobbyId = Number(id);
  const router = useRouter();
  const goBack = useSmartBack("/(tabs)");
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();
  const { currentStep, setPressButtonLayout } = useTour();
  const pressButtonViewRef = useRef<View>(null);
  const [pressedChannels, setPressedChannels] = useState<Set<string>>(new Set());
  const [showScript, setShowScript] = useState(false);

  const { data: lobby } = trpc.lobbies.byId.useQuery({ id: lobbyId });
  const { data: pressureStats, refetch: refetchStats } = trpc.pressure.stats.useQuery({ lobbyId });
  const { data: cards } = trpc.pressure.generateCards.useQuery({ lobbyId });
  const { data: smartMilestones } = trpc.smartMilestones.list.useQuery({ lobbyId });

  const trackMutation = trpc.pressure.track.useMutation({
    onSuccess: () => refetchStats(),
  });

  const checkMilestoneMutation = trpc.smartMilestones.checkAchieve.useMutation();

  const handlePressChannel = async (channel: typeof PRESSURE_CHANNELS[0]) => {
    if (!user) {
      Alert.alert("Login necessário", "Faça login para pressionar parlamentares.");
      return;
    }
    if (!lobby) return;

    const hashtag = `#LobbyPopular #${lobby.title.replace(/\s+/g, "").slice(0, 20)}`;
    const lobbyUrl = `https://lobbypopular.app/lobby/${lobbyId}`;
    const message = `Apoio a campanha: "${lobby.title}"\n\n${lobby.description.slice(0, 200)}...\n\nVeja mais: ${lobbyUrl}\n\n${hashtag}`;

    try {
      switch (channel.key) {
        case "whatsapp": {
          const waUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
          const canOpen = await Linking.canOpenURL(waUrl);
          if (canOpen) {
            await Linking.openURL(waUrl);
          } else {
            await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
          }
          break;
        }
        case "email": {
          const subject = `[Populus] ${lobby.title}`;
          const body = `Prezado(a) Parlamentar,\n\nSou cidadão(ã) e apoio a campanha "${lobby.title}".\n\n${lobby.description}\n\nSolicito sua atenção e ação sobre esta demanda.\n\nAtenciosamente,\n${user.name ?? "Cidadão(ã)"}\n\nLink da campanha: ${lobbyUrl}`;
          await Linking.openURL(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
          break;
        }
        case "twitter": {
          const tweet = `${lobby.title.slice(0, 100)} — Apoie esta causa! ${lobbyUrl} ${hashtag}`;
          await Linking.openURL(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`);
          break;
        }
        case "phone": {
          setShowScript(true);
          return; // Don't track yet — user will confirm after call
        }
        case "copy": {
          if (Platform.OS === "web") {
            await navigator.clipboard.writeText(`${lobby.title}\n\n${lobbyUrl}`);
          } else {
            await Share.share({ message: `${lobby.title}\n\n${lobbyUrl}`, url: lobbyUrl });
          }
          break;
        }
      }

      // Track the action
      await trackMutation.mutateAsync({ lobbyId, channel: channel.key });
      setPressedChannels(prev => new Set([...prev, channel.key]));

      // Check if any smart milestones were achieved
      if (lobby.supportCount) {
        await checkMilestoneMutation.mutateAsync({ lobbyId, currentCount: lobby.supportCount });
      }
    } catch (err) {
      console.error("Pressure action error:", err);
    }
  };

  const handlePhoneConfirm = async () => {
    setShowScript(false);
    await trackMutation.mutateAsync({ lobbyId, channel: "phone" });
    setPressedChannels(prev => new Set([...prev, "phone"]));
  };

  if (!lobby) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const progress = Math.min(100, Math.round((lobby.supportCount / lobby.goalCount) * 100));
  const nextMilestone = SMART_MILESTONES_DISPLAY.find(m => lobby.supportCount < m.count);
  const weeklyPressure = pressureStats?.weekly ?? 0;
  const totalPressure = pressureStats?.total ?? 0;
  const pressureGoal = 1000;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tooltip contextual de primeira visita */}
      <View style={{ position: "relative" }}>
        <ContextualTooltip
          id="pressure_first_visit"
          message="Sabia que 1.000 mensagens garantem uma audiência pública? Cada envio conta!"
          icon="📣"
          position="bottom"
          accentColor="#C0392B"
        />
      </View>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1B4F72", paddingTop: insets.top + 8 }]}>
        <BackButton
          onPress={goBack}
          variant="dark"
          label="Voltar"
        />
        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>PRESSÃO POPULAR</Text>
          <Text style={styles.headerTitle} numberOfLines={2}>{lobby.title}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pressure Counter */}
        <View style={[styles.counterCard, { backgroundColor: "#C0392B" }]}>
          <Text style={styles.counterNumber}>{totalPressure.toLocaleString("pt-BR")}</Text>
          <Text style={styles.counterLabel}>mensagens enviadas no total</Text>
          <View style={styles.counterDivider} />
          <Text style={styles.counterWeekly}>
            🔥 <Text style={styles.counterWeeklyBold}>{weeklyPressure.toLocaleString("pt-BR")}</Text> esta semana
          </Text>
          {weeklyPressure < pressureGoal && (
            <Text style={styles.counterRemaining}>
              Faltam {(pressureGoal - weeklyPressure).toLocaleString("pt-BR")} para a meta semanal
            </Text>
          )}
          {/* Weekly progress bar */}
          <View style={styles.weeklyBar}>
            <View
              style={[
                styles.weeklyBarFill,
                { width: `${Math.min(100, (weeklyPressure / pressureGoal) * 100)}%` },
              ]}
            />
          </View>
        </View>

        {/* Support Progress */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Apoios</Text>
            <Text style={[styles.progressCount, { color: colors.primary }]}>
              {lobby.supportCount.toLocaleString("pt-BR")} / {lobby.goalCount.toLocaleString("pt-BR")}
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
          </View>
          {nextMilestone && (
            <Text style={[styles.nextMilestone, { color: colors.muted }]}>
              Próxima meta: {nextMilestone.count.toLocaleString("pt-BR")} apoios → {nextMilestone.label}
            </Text>
          )}
        </View>

        {/* Smart Milestones */}
        <View style={styles.milestonesSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, paddingHorizontal: 16 }]}>
            Metas Inteligentes
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.milestonesScroll}>
            {SMART_MILESTONES_DISPLAY.map((m) => {
              const achieved = lobby.supportCount >= m.count;
              const dbMilestone = smartMilestones?.find(sm => sm.targetCount === m.count);
              return (
                <View
                  key={m.count}
                  style={[
                    styles.milestoneCard,
                    { backgroundColor: achieved ? m.color : colors.surface, borderColor: m.color },
                  ]}
                >
                  <IconSymbol name={m.icon} size={20} color={achieved ? "#fff" : m.color} />
                  <Text style={[styles.milestoneCount, { color: achieved ? "#fff" : m.color }]}>
                    {m.count >= 1000 ? `${m.count / 1000}k` : m.count}
                  </Text>
                  <Text style={[styles.milestoneLabel, { color: achieved ? "#fff" : colors.foreground }]}>
                    {m.label}
                  </Text>
                  {achieved && <Text style={styles.milestoneCheck}>✓</Text>}
                  {dbMilestone?.achievedAt && (
                    <Text style={[styles.milestoneDate, { color: achieved ? "rgba(255,255,255,0.8)" : colors.muted }]}>
                      {new Date(dbMilestone.achievedAt).toLocaleDateString("pt-BR")}
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Big Pressure Button */}
        <View style={styles.bigButtonSection}>
          <Text style={[styles.bigButtonTitle, { color: colors.foreground }]}>
            Pressionar Agora
          </Text>
          <Text style={[styles.bigButtonSubtitle, { color: colors.muted }]}>
            Escolha como quer agir. Cada ação conta!
          </Text>
        </View>

        {/* Pressure Channels — medido para o tour spotlight */}
        <View
          ref={pressButtonViewRef}
          style={styles.channelsGrid}
          onLayout={() => {
            if (currentStep === "press_action" && pressButtonViewRef.current) {
              pressButtonViewRef.current.measure((_x, _y, width, height, pageX, pageY) => {
                setPressButtonLayout({ x: pageX, y: pageY, width, height });
              });
            }
          }}
        >
          {PRESSURE_CHANNELS.map((channel) => {
            const pressed = pressedChannels.has(channel.key);
            const channelCount = pressureStats?.byChannel?.[channel.key] ?? 0;
            return (
              <Pressable
                key={channel.key}
                style={({ pressed: isPressed }) => [
                  styles.channelCard,
                  { backgroundColor: colors.surface, borderColor: pressed ? channel.color : colors.border },
                  isPressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                  pressed && { borderWidth: 2 },
                ]}
                onPress={() => handlePressChannel(channel)}
              >
                <View style={[styles.channelIcon, { backgroundColor: channel.color + "20" }]}>
                  <IconSymbol name={channel.icon} size={24} color={channel.color} />
                </View>
                <Text style={[styles.channelLabel, { color: colors.foreground }]}>{channel.label}</Text>
                <Text style={[styles.channelDesc, { color: colors.muted }]}>{channel.description}</Text>
                {channelCount > 0 && (
                  <Text style={[styles.channelCount, { color: channel.color }]}>
                    {channelCount.toLocaleString("pt-BR")} ações
                  </Text>
                )}
                {pressed && (
                  <View style={[styles.channelDone, { backgroundColor: channel.color }]}>
                    <Text style={styles.channelDoneText}>✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Pressure Cards */}
        {cards && cards.length > 0 && (
          <View style={styles.cardsSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Cards para Compartilhar
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
              Compartilhe estes cards nas suas redes sociais
            </Text>
            {cards.map((card, i) => (
              <Pressable
                key={i}
                style={[styles.pressureCard, { backgroundColor: card.color }]}
                onPress={async () => {
                  const text = `${card.headline}\n\n${card.body}\n\n${card.stat}\n\nhttps://lobbypopular.app/lobby/${lobbyId}`;
                  if (Platform.OS === "web") {
                    await navigator.clipboard.writeText(text);
                    Alert.alert("Copiado!", "Card copiado para a área de transferência.");
                  } else {
                    await Share.share({ message: text });
                  }
                }}
              >
                <Text style={styles.cardType}>{card.title}</Text>
                <Text style={styles.cardHeadline}>{card.headline}</Text>
                <Text style={styles.cardBody}>{card.body}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardStat}>{card.stat}</Text>
                  <View style={styles.cardCta}>
                    <Text style={styles.cardCtaText}>{card.cta} →</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Phone Script Modal */}
      {showScript && (
        <View style={styles.scriptOverlay}>
          <View style={[styles.scriptModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.scriptTitle, { color: colors.foreground }]}>
              📞 Roteiro de Ligação
            </Text>
            <Text style={[styles.scriptText, { color: colors.foreground }]}>
              {`"Bom dia/tarde, gostaria de falar com o gabinete do(a) vereador(a).\n\nMeu nome é ${user?.name ?? "[seu nome]"} e sou morador(a) desta cidade.\n\nEstou ligando para solicitar atenção à campanha "${lobby.title}".\n\nEsta causa já conta com ${lobby.supportCount.toLocaleString("pt-BR")} apoiadores e precisa de uma resposta formal.\n\nPoderia registrar minha solicitação e me informar sobre os próximos passos?\n\nObrigado(a)!"`}
            </Text>
            <View style={styles.scriptButtons}>
              <Pressable
                style={[styles.scriptBtn, { backgroundColor: colors.border }]}
                onPress={() => setShowScript(false)}
              >
                <Text style={[styles.scriptBtnText, { color: colors.foreground }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.scriptBtn, { backgroundColor: "#34C759" }]}
                onPress={handlePhoneConfirm}
              >
                <Text style={[styles.scriptBtnText, { color: "#fff" }]}>Já liguei ✓</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: { flex: 1 },
  headerLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  scroll: { flex: 1 },
  counterCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  counterNumber: { fontSize: 48, fontWeight: "800", color: "#fff" },
  counterLabel: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  counterDivider: { width: 40, height: 1, backgroundColor: "rgba(255,255,255,0.3)", marginVertical: 12 },
  counterWeekly: { fontSize: 16, color: "#fff" },
  counterWeeklyBold: { fontWeight: "700" },
  counterRemaining: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  weeklyBar: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
    marginTop: 12,
    overflow: "hidden",
  },
  weeklyBarFill: { height: "100%", backgroundColor: "#fff", borderRadius: 3 },
  section: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  sectionSubtitle: { fontSize: 13, marginBottom: 12 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressCount: { fontSize: 14, fontWeight: "700" },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", borderRadius: 4 },
  nextMilestone: { fontSize: 12, marginTop: 4 },
  milestonesSection: { marginBottom: 16 },
  milestonesScroll: { paddingHorizontal: 16, gap: 12 },
  milestoneCard: {
    width: 100,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1.5,
    gap: 4,
  },
  milestoneCount: { fontSize: 18, fontWeight: "800" },
  milestoneLabel: { fontSize: 10, textAlign: "center", fontWeight: "600" },
  milestoneCheck: { fontSize: 16, color: "#fff" },
  milestoneDate: { fontSize: 9, textAlign: "center" },
  bigButtonSection: { paddingHorizontal: 16, marginBottom: 16 },
  bigButtonTitle: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  bigButtonSubtitle: { fontSize: 14 },
  channelsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  channelCard: {
    width: "47%",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 6,
    position: "relative",
  },
  channelIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  channelLabel: { fontSize: 15, fontWeight: "700" },
  channelDesc: { fontSize: 11 },
  channelCount: { fontSize: 11, fontWeight: "600" },
  channelDone: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  channelDoneText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardsSection: { paddingHorizontal: 16, marginBottom: 16 },
  pressureCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  cardType: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 1.5, marginBottom: 6 },
  cardHeadline: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 8 },
  cardBody: { fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardStat: { fontSize: 12, color: "rgba(255,255,255,0.8)", flex: 1 },
  cardCta: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cardCtaText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  scriptOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  scriptModal: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  scriptTitle: { fontSize: 18, fontWeight: "700" },
  scriptText: { fontSize: 14, lineHeight: 22 },
  scriptButtons: { flexDirection: "row", gap: 12 },
  scriptBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  scriptBtnText: { fontSize: 14, fontWeight: "700" },
});
