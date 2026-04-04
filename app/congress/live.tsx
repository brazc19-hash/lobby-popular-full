import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

// Stream HLS oficial da TV Câmara (Access-Control-Allow-Origin: *)
const CAMARA_HLS = "https://stream3.camara.gov.br/tv1/manifest.m3u8";

type Channel = "camara" | "senado";

interface ScheduleItem {
  time: string;
  title: string;
  type: "plenario" | "comissao" | "audiencia" | "sessao";
  house: "camara" | "senado";
}

const SCHEDULE_MOCK: ScheduleItem[] = [
  { time: "09:00", title: "Comissão de Saúde — Audiência Pública sobre SUS", type: "audiencia", house: "camara" },
  { time: "10:30", title: "Plenário — Votação PL 1234/2025 (Educação Básica)", type: "plenario", house: "camara" },
  { time: "14:00", title: "Comissão de Meio Ambiente — Debate sobre Amazônia", type: "comissao", house: "senado" },
  { time: "15:30", title: "Plenário do Senado — Votação da LDO 2026", type: "plenario", house: "senado" },
  { time: "16:00", title: "Comissão de Constituição e Justiça — CCJ", type: "comissao", house: "camara" },
  { time: "17:30", title: "Audiência Pública — Reforma Tributária impactos", type: "audiencia", house: "senado" },
];

const TYPE_COLORS: Record<string, string> = {
  plenario: "#C0392B",
  comissao: "#1B4F72",
  audiencia: "#27AE60",
  sessao: "#8E44AD",
};

const TYPE_LABELS: Record<string, string> = {
  plenario: "Plenário",
  comissao: "Comissão",
  audiencia: "Audiência",
  sessao: "Sessão",
};

export default function CongressLiveScreen() {
  const colors = useColors();
  const goBack = useSmartBack("/congress");
  const [activeChannel, setActiveChannel] = useState<Channel>("camara");
  const [isLoadingYT, setIsLoadingYT] = useState(false);

  // Player HLS para TV Câmara
  const camaraPlayer = useVideoPlayer(CAMARA_HLS, (p) => {
    p.loop = false;
    p.play();
  });

  const [status, setStatus] = useState<string>(camaraPlayer.status);
  const [isPlaying, setIsPlaying] = useState<boolean>(camaraPlayer.playing);

  useEffect(() => {
    const statusSub = camaraPlayer.addListener("statusChange", (e) => setStatus(e.status));
    const playingSub = camaraPlayer.addListener("playingChange", (e) => setIsPlaying(e.isPlaying));
    return () => {
      statusSub.remove();
      playingSub.remove();
    };
  }, [camaraPlayer]);

  useEffect(() => {
    return () => {
      camaraPlayer.pause();
    };
  }, [camaraPlayer]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      camaraPlayer.pause();
    } else {
      camaraPlayer.play();
    }
  };

  const openSenadoYouTube = () => {
    Linking.openURL("https://www.youtube.com/@TVSenado/live");
  };

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1B4F72" }]}>
        <BackButton onPress={goBack} variant="dark" label="Voltar" />
        <View style={styles.headerCenter}>
          <View style={styles.liveDot} />
          <Text style={styles.headerTitle}>AO VIVO</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerDate}>{today}</Text>
        </View>
      </View>

      {/* Channel Selector */}
      <View style={[styles.channelBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(["camara", "senado"] as Channel[]).map((ch) => (
          <Pressable
            key={ch}
            onPress={() => setActiveChannel(ch)}
            style={[
              styles.channelBtn,
              activeChannel === ch && { borderBottomColor: "#1B4F72", borderBottomWidth: 2 },
            ]}
          >
            <Text style={styles.channelEmoji}>{ch === "camara" ? "🏛️" : "⚖️"}</Text>
            <Text
              style={[
                styles.channelLabel,
                { color: activeChannel === ch ? "#1B4F72" : colors.muted },
              ]}
            >
              {ch === "camara" ? "TV Câmara" : "TV Senado"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Video Player */}
        {activeChannel === "camara" ? (
          <View style={styles.playerWrap}>
            {/* HLS Player */}
            {Platform.OS !== "web" ? (
              <>
                <VideoView
                  player={camaraPlayer}
                  style={styles.videoView}
                  allowsFullscreen
                  allowsPictureInPicture
                  contentFit="contain"
                  nativeControls
                />
                {status === "loading" && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.loadingText}>Conectando ao stream...</Text>
                  </View>
                )}
                {status === "error" && (
                  <View style={styles.errorOverlay}>
                    <Text style={styles.errorEmoji}>📡</Text>
                    <Text style={styles.errorTitle}>Stream indisponível</Text>
                    <Text style={styles.errorBody}>
                      A TV Câmara pode estar fora do ar. Tente novamente ou acesse pelo YouTube.
                    </Text>
                    <Pressable
                      onPress={() => Linking.openURL("https://www.youtube.com/@CamaradosDeputados/live")}
                      style={({ pressed }) => [styles.errorBtn, { opacity: pressed ? 0.8 : 1 }]}
                    >
                      <Text style={styles.errorBtnText}>▶ Abrir no YouTube</Text>
                    </Pressable>
                  </View>
                )}
              </>
            ) : (
              // Web fallback — embed YouTube
              <View style={styles.webFallback}>
                <Text style={styles.webFallbackEmoji}>📺</Text>
                <Text style={[styles.webFallbackTitle, { color: colors.foreground }]}>TV Câmara ao Vivo</Text>
                <Text style={[styles.webFallbackBody, { color: colors.muted }]}>
                  O player de vídeo ao vivo está disponível apenas no app mobile. No navegador, acesse pelo YouTube.
                </Text>
                <Pressable
                  onPress={() => Linking.openURL("https://www.youtube.com/@CamaradosDeputados/live")}
                  style={({ pressed }) => [styles.ytBtn, { opacity: pressed ? 0.8 : 1 }]}
                >
                  <Text style={styles.ytBtnText}>▶ Assistir no YouTube</Text>
                </Pressable>
              </View>
            )}

            {/* Player Controls (mobile only) */}
            {Platform.OS !== "web" && status !== "error" && (
              <View style={[styles.controls, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Pressable
                  onPress={handleTogglePlay}
                  style={({ pressed }) => [styles.controlBtn, { backgroundColor: "#1B4F72", opacity: pressed ? 0.8 : 1 }]}
                >
                  <Text style={styles.controlBtnText}>{isPlaying ? "⏸ Pausar" : "▶ Reproduzir"}</Text>
                </Pressable>
                <Pressable
                  onPress={() => Linking.openURL("https://www.youtube.com/@CamaradosDeputados/live")}
                  style={({ pressed }) => [
                    styles.controlBtn,
                    { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text style={[styles.controlBtnText, { color: colors.foreground }]}>YouTube</Text>
                </Pressable>
              </View>
            )}

            {/* Info */}
            <View style={[styles.infoBox, { backgroundColor: "#1B4F72" + "15", borderColor: "#1B4F72" + "30" }]}>
              <Text style={styles.infoEmoji}>📡</Text>
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                Stream oficial da TV Câmara via protocolo HLS. Qualidade automática conforme sua conexão.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.playerWrap}>
            <View style={[styles.senadoCard, { backgroundColor: "#6C3483" + "10", borderColor: "#6C3483" + "30" }]}>
              <Text style={styles.senadoEmoji}>⚖️</Text>
              <Text style={[styles.senadoTitle, { color: colors.foreground }]}>TV Senado ao Vivo</Text>
              <Text style={[styles.senadoBody, { color: colors.muted }]}>
                A TV Senado transmite ao vivo pelo YouTube com cobertura completa do Plenário, comissões e audiências públicas.
              </Text>
              <Pressable
                onPress={openSenadoYouTube}
                style={({ pressed }) => [styles.senadoBtn, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Text style={styles.senadoBtnText}>▶ Assistir TV Senado ao Vivo</Text>
              </Pressable>
              <Text style={[styles.senadoHint, { color: colors.muted }]}>
                Abre o canal oficial do Senado no YouTube
              </Text>
            </View>
          </View>
        )}

        {/* Agenda do Dia */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📅 Agenda de Hoje</Text>
          <Text style={[styles.sectionSub, { color: colors.muted }]}>Sessões e audiências previstas</Text>

          {SCHEDULE_MOCK.filter((item) => activeChannel === "camara" ? item.house === "camara" : item.house === "senado").map((item, idx) => (
            <View
              key={idx}
              style={[styles.scheduleItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.scheduleTime, { backgroundColor: "#1B4F72" + "15" }]}>
                <Text style={[styles.scheduleTimeText, { color: "#1B4F72" }]}>{item.time}</Text>
              </View>
              <View style={styles.scheduleContent}>
                <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[item.type] + "20" }]}>
                  <Text style={[styles.typeBadgeText, { color: TYPE_COLORS[item.type] }]}>
                    {TYPE_LABELS[item.type]}
                  </Text>
                </View>
                <Text style={[styles.scheduleTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Como usar */}
        <View style={[styles.howToBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.howToTitle, { color: colors.foreground }]}>💡 Como usar o Populus durante as sessões</Text>
          {[
            { emoji: "👀", text: "Assista ao vivo e identifique votações que afetam suas campanhas" },
            { emoji: "📣", text: "Pressione deputados e senadores em tempo real durante a votação" },
            { emoji: "📸", text: "Registre e compartilhe momentos importantes no Feed Cidadão" },
            { emoji: "🔔", text: "Configure alertas para ser notificado quando pautas de interesse entrarem em votação" },
          ].map((tip, idx) => (
            <View key={idx} style={styles.howToRow}>
              <Text style={styles.howToEmoji}>{tip.emoji}</Text>
              <Text style={[styles.howToText, { color: colors.muted }]}>{tip.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA Pressão */}
        <Pressable
          onPress={() => router.push("/pressure" as never)}
          style={({ pressed }) => [styles.pressureCta, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.pressureCtaEmoji}>📣</Text>
          <View style={styles.pressureCtaContent}>
            <Text style={styles.pressureCtaTitle}>Pressione agora</Text>
            <Text style={styles.pressureCtaBody}>Envie mensagens aos parlamentares enquanto assiste ao vivo</Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color="#FFFFFF" />
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 12,
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#E74C3C" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", letterSpacing: 1 },
  headerRight: { alignItems: "flex-end" },
  headerDate: { fontSize: 11, color: "rgba(255,255,255,0.7)", textTransform: "capitalize" },
  channelBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  channelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  channelEmoji: { fontSize: 18 },
  channelLabel: { fontSize: 14, fontWeight: "600" },
  scroll: { paddingBottom: 20 },
  playerWrap: { padding: 16, gap: 12 },
  videoView: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    gap: 12,
  },
  loadingText: { color: "#FFFFFF", fontSize: 14 },
  errorOverlay: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  errorEmoji: { fontSize: 40 },
  errorTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  errorBody: { fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 20 },
  errorBtn: {
    backgroundColor: "#E74C3C",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  errorBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  webFallback: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  webFallbackEmoji: { fontSize: 48 },
  webFallbackTitle: { fontSize: 18, fontWeight: "700" },
  webFallbackBody: { fontSize: 13, lineHeight: 20, textAlign: "center" },
  ytBtn: {
    backgroundColor: "#E74C3C",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  ytBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  controls: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  controlBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  controlBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoEmoji: { fontSize: 18 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  senadoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  senadoEmoji: { fontSize: 48 },
  senadoTitle: { fontSize: 20, fontWeight: "700" },
  senadoBody: { fontSize: 14, lineHeight: 22, textAlign: "center" },
  senadoBtn: {
    backgroundColor: "#6C3483",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  senadoBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  senadoHint: { fontSize: 11 },
  section: { paddingHorizontal: 16, gap: 10, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  sectionSub: { fontSize: 13, marginTop: -4 },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  scheduleTime: {
    width: 52,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  scheduleTimeText: { fontSize: 13, fontWeight: "700" },
  scheduleContent: { flex: 1, gap: 5 },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  scheduleTitle: { fontSize: 13, lineHeight: 18 },
  howToBox: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  howToTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  howToRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  howToEmoji: { fontSize: 16, width: 24 },
  howToText: { flex: 1, fontSize: 13, lineHeight: 20 },
  pressureCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    backgroundColor: "#C0392B",
    borderRadius: 16,
    padding: 16,
  },
  pressureCtaEmoji: { fontSize: 28 },
  pressureCtaContent: { flex: 1 },
  pressureCtaTitle: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  pressureCtaBody: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 },
});
