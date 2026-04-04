import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const ACHIEVEMENT_META: Record<string, { title: string; description: string; emoji: string; color: string }> = {
  first_support:          { title: "Primeiro Apoio",          description: "Apoiou o primeiro lobby",              emoji: "🤝", color: "#27AE60" },
  first_lobby:            { title: "Primeiro Lobby",          description: "Criou o primeiro lobby",               emoji: "🏛️", color: "#2980B9" },
  first_pressure:         { title: "Primeira Pressão",        description: "Enviou a primeira mensagem de pressão", emoji: "📣", color: "#E67E22" },
  pressure_1000:          { title: "Pressionador Incansável", description: "1.000 mensagens de pressão enviadas",   emoji: "⚡", color: "#C0392B" },
  community_1000_members: { title: "Articulador",             description: "Criou comunidade com 1.000+ membros",  emoji: "👥", color: "#8E44AD" },
  lobby_became_bill:      { title: "Legislador Popular",      description: "Lobby virou projeto de lei",           emoji: "📜", color: "#F39C12" },
  invite_5_friends:       { title: "Mobilizador",             description: "Convidou 5 amigos para o Populus",     emoji: "🌟", color: "#1ABC9C" },
};

const ACTION_LABELS: Record<string, { label: string; emoji: string; points: number }> = {
  lobby_support:   { label: "Apoiou lobby",             emoji: "🤝", points: 10  },
  lobby_create:    { label: "Criou lobby",              emoji: "🏛️", points: 50  },
  pressure_action: { label: "Ação de pressão",          emoji: "📣", points: 20  },
  share_card:      { label: "Compartilhou card",        emoji: "📤", points: 5   },
  invite_friend:   { label: "Convidou amigo",           emoji: "👋", points: 100 },
  lobby_approved:  { label: "Lobby aprovado",           emoji: "✅", points: 500 },
};

function LevelBadge({ level, emoji, color, title }: { level: number; emoji: string; color: string; title: string }) {
  return (
    <View style={[styles.levelBadge, { backgroundColor: color + "20", borderColor: color }]}>
      <Text style={styles.levelEmoji}>{emoji}</Text>
      <Text style={[styles.levelNum, { color }]}>Nível {level}</Text>
      <Text style={[styles.levelTitle, { color }]}>{title}</Text>
    </View>
  );
}

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.max(2, progress)}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function GamificationScreen() {
  const colors = useColors();
  const router = useRouter();
  const goBack = useSmartBack("/(tabs)");

  const { data: stats, isLoading: statsLoading } = trpc.gamification.myStats.useQuery(undefined, {
    retry: false,
  });
  const { data: leaderboard, isLoading: lbLoading } = trpc.gamification.leaderboard.useQuery(
    { limit: 10 },
    { retry: false }
  );

  const formatDate = useCallback((dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }, []);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: "#1E3A5F",
      paddingTop: 16,
      paddingBottom: 24,
      paddingHorizontal: 20,
    },
    headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 12 },
    headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 4 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 },
    pointsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
    pointsTotal: { fontSize: 40, fontWeight: "800", color: "#1E3A5F" },
    pointsLabel: { fontSize: 13, color: colors.muted, marginTop: 2 },
    progressLabel: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    progressText: { fontSize: 12, color: colors.muted },
    achievementRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    achievementEmoji: { fontSize: 28, marginRight: 12 },
    achievementTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground },
    achievementDesc: { fontSize: 12, color: colors.muted, marginTop: 2 },
    achievementDate: { fontSize: 11, color: colors.muted, marginLeft: "auto" as any },
    lockedAchievement: { opacity: 0.4 },
    historyRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    historyEmoji: { fontSize: 20, marginRight: 10 },
    historyLabel: { flex: 1, fontSize: 13, color: colors.foreground },
    historyPoints: { fontSize: 14, fontWeight: "700", color: "#27AE60" },
    historyDate: { fontSize: 11, color: colors.muted, marginLeft: 8 },
    leaderRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rankNum: { fontSize: 16, fontWeight: "800", color: colors.muted, width: 28 },
    rankName: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.foreground },
    rankPoints: { fontSize: 13, color: "#1E3A5F", fontWeight: "700" },
    rankLevel: { fontSize: 12, color: colors.muted, marginLeft: 6 },
    emptyText: { textAlign: "center", color: colors.muted, fontSize: 14, paddingVertical: 24 },
    howToCard: {
      backgroundColor: "#1E3A5F" + "10",
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: "#1E3A5F" + "30",
    },
    howToTitle: { fontSize: 15, fontWeight: "700", color: "#1E3A5F", marginBottom: 10 },
    howToRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    howToEmoji: { fontSize: 18, marginRight: 10, width: 28 },
    howToLabel: { flex: 1, fontSize: 13, color: colors.foreground },
    howToPoints: { fontSize: 13, fontWeight: "700", color: "#27AE60" },
  });

  const ALL_ACHIEVEMENT_KEYS = Object.keys(ACHIEVEMENT_META);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <BackButton onPress={goBack} label="Voltar" variant="dark" />
          <Text style={s.headerTitle}>⭐ Minha Jornada Cívica</Text>
          <Text style={s.headerSub}>Pontos, conquistas e impacto popular</Text>
        </View>

        {statsLoading ? (
          <ActivityIndicator color="#1E3A5F" style={{ marginTop: 40 }} />
        ) : !stats ? (
          <Text style={[s.emptyText, { marginTop: 40 }]}>Faça login para ver seus pontos.</Text>
        ) : (
          <>
            {/* Nível e Pontos */}
            <View style={s.card}>
              <View style={s.pointsRow}>
                <View>
                  <Text style={s.pointsTotal}>{stats.totalPoints.toLocaleString("pt-BR")}</Text>
                  <Text style={s.pointsLabel}>pontos acumulados</Text>
                </View>
                <LevelBadge
                  level={stats.level.level}
                  emoji={stats.level.emoji}
                  color={stats.level.color}
                  title={stats.level.title}
                />
              </View>

              {/* Barra de progresso */}
              {stats.nextLevel && (
                <>
                  <View style={s.progressLabel}>
                    <Text style={s.progressText}>{stats.level.title}</Text>
                    <Text style={s.progressText}>{stats.progressToNext}% → {stats.nextLevel.title}</Text>
                  </View>
                  <ProgressBar progress={stats.progressToNext} color={stats.level.color} />
                  <Text style={[s.progressText, { marginTop: 6, textAlign: "center" }]}>
                    Faltam {(stats.nextLevel.minPoints - stats.totalPoints).toLocaleString("pt-BR")} pontos para o próximo nível
                  </Text>
                </>
              )}
              {!stats.nextLevel && (
                <Text style={[s.progressText, { textAlign: "center", marginTop: 8, color: "#C0392B", fontWeight: "700" }]}>
                  🏆 Nível máximo atingido!
                </Text>
              )}
            </View>

            {/* Como ganhar pontos */}
            <View style={s.howToCard}>
              <Text style={s.howToTitle}>Como ganhar pontos</Text>
              {Object.entries(ACTION_LABELS).map(([key, meta]) => (
                <View key={key} style={s.howToRow}>
                  <Text style={s.howToEmoji}>{meta.emoji}</Text>
                  <Text style={s.howToLabel}>{meta.label}</Text>
                  <Text style={s.howToPoints}>+{meta.points} pts</Text>
                </View>
              ))}
            </View>

            {/* Conquistas */}
            <View style={s.card}>
              <Text style={s.sectionTitle}>🏅 Conquistas</Text>
              {ALL_ACHIEVEMENT_KEYS.map((key) => {
                const meta = ACHIEVEMENT_META[key];
                const unlocked = stats.achievements.find((a) => a.achievementKey === key);
                return (
                  <View key={key} style={[s.achievementRow, !unlocked && s.lockedAchievement]}>
                    <Text style={s.achievementEmoji}>{meta.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.achievementTitle}>{meta.title}</Text>
                      <Text style={s.achievementDesc}>{meta.description}</Text>
                    </View>
                    {unlocked ? (
                      <Text style={s.achievementDate}>{formatDate(unlocked.unlockedAt)}</Text>
                    ) : (
                      <Text style={[s.achievementDate, { color: colors.muted }]}>🔒</Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Histórico de pontos */}
            {stats.history.length > 0 && (
              <View style={s.card}>
                <Text style={s.sectionTitle}>📋 Histórico Recente</Text>
                {stats.history.map((item) => {
                  const meta = ACTION_LABELS[item.action] ?? { emoji: "⭐", label: item.action };
                  return (
                    <View key={item.id} style={s.historyRow}>
                      <Text style={s.historyEmoji}>{meta.emoji}</Text>
                      <Text style={s.historyLabel}>{item.description ?? meta.label}</Text>
                      <Text style={s.historyPoints}>+{item.points}</Text>
                      <Text style={s.historyDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Ranking */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>🏆 Ranking de Cidadãos Ativos</Text>
          {lbLoading ? (
            <ActivityIndicator color="#1E3A5F" />
          ) : !leaderboard || leaderboard.length === 0 ? (
            <Text style={s.emptyText}>Nenhum dado disponível ainda.</Text>
          ) : (
            leaderboard.map((item, idx) => (
              <Pressable
                key={item.userId}
                style={s.leaderRow}
                onPress={() => router.push(`/user/${item.userId}`)}
              >
                <Text style={s.rankNum}>
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}º`}
                </Text>
                <Text style={s.rankName}>{item.name}</Text>
                <Text style={s.rankPoints}>{item.totalPoints.toLocaleString("pt-BR")} pts</Text>
                <Text style={s.rankLevel}>{item.level.emoji}</Text>
              </Pressable>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  levelBadge: {
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    minWidth: 100,
  },
  levelEmoji: { fontSize: 28 },
  levelNum: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  levelTitle: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  progressTrack: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
});
