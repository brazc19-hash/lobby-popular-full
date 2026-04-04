import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { useOfflineLobbies, type OfflineLobby } from "@/hooks/use-offline-lobbies";
import { useColors } from "@/hooks/use-colors";
import { useSmartBack } from "@/hooks/use-smart-back";

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)} dias`;
}

function LobbyCard({ lobby, onPress, onRemove, colors }: {
  lobby: OfflineLobby;
  onPress: () => void;
  onRemove: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const categoryLabel = lobby.category === "national" ? "Nacional" : "Local";
  const statusLabel = lobby.status === "active" ? "Ativo" : lobby.status === "pending" ? "Pendente" : "Encerrado";
  const statusColor = lobby.status === "active" ? colors.success : lobby.status === "pending" ? colors.warning : colors.muted;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]}>{categoryLabel}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.6 : 1 }]}
          onPress={onRemove}
          hitSlop={8}
        >
          <IconSymbol name="xmark" size={14} color={colors.muted} />
        </Pressable>
      </View>

      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
        {lobby.title}
      </Text>
      <Text style={[styles.cardDesc, { color: colors.muted }]} numberOfLines={2}>
        {lobby.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <IconSymbol name="hand.thumbsup.fill" size={12} color={colors.muted} />
          <Text style={[styles.footerText, { color: colors.muted }]}>
            {lobby.supportCount >= 1000
              ? `${(lobby.supportCount / 1000).toFixed(1)}k`
              : lobby.supportCount} apoios
          </Text>
          {lobby.locationCity && (
            <>
              <Text style={[styles.footerDot, { color: colors.muted }]}>·</Text>
              <Text style={[styles.footerText, { color: colors.muted }]}>
                {lobby.locationCity}{lobby.locationState ? `, ${lobby.locationState}` : ""}
              </Text>
            </>
          )}
        </View>
        <Text style={[styles.savedAt, { color: colors.muted }]}>
          Salvo {formatRelativeTime(lobby.savedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function SavedLobbiesScreen() {
  const colors = useColors();
  const goBack = useSmartBack("/(tabs)");
  const { savedLobbies, isOnline, removeLobby, clearAll } = useOfflineLobbies();

  const handleRemove = (lobby: OfflineLobby) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert(
      "Remover lobby salvo",
      `Deseja remover "${lobby.title}" dos lobbys salvos?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: () => removeLobby(lobby.id) },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Limpar todos os lobbys",
      "Deseja remover todos os lobbys salvos para offline?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Limpar tudo", style: "destructive", onPress: clearAll },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner visible={!isOnline} />

      <ScreenContainer edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <BackButton label="Voltar" onPress={goBack} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Lobbys Salvos</Text>
          {savedLobbies.length > 0 ? (
            <Pressable
              style={({ pressed }) => [styles.clearBtn, { opacity: pressed ? 0.6 : 1 }]}
              onPress={handleClearAll}
            >
              <Text style={[styles.clearBtnText, { color: colors.error }]}>Limpar</Text>
            </Pressable>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {/* Offline indicator */}
        {!isOnline && (
          <View style={[styles.offlineNote, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40" }]}>
            <Text style={styles.offlineNoteIcon}>📶</Text>
            <Text style={[styles.offlineNoteText, { color: colors.foreground }]}>
              Você está offline. Apenas os lobbys salvos estão disponíveis.
            </Text>
          </View>
        )}

        {savedLobbies.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📥</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum lobby salvo</Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>
              Salve lobbys para acessá-los sem internet. Toque em "Salvar offline" no dashboard de qualquer lobby.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.browseBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push("/(tabs)")}
            >
              <Text style={styles.browseBtnText}>Explorar Lobbys</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={savedLobbies}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <LobbyCard
                lobby={item}
                colors={colors}
                onPress={() => router.push(`/lobby/${item.id}` as any)}
                onRemove={() => handleRemove(item)}
              />
            )}
            ListHeaderComponent={
              <Text style={[styles.listHeader, { color: colors.muted }]}>
                {savedLobbies.length} {savedLobbies.length === 1 ? "lobby salvo" : "lobbys salvos"}
              </Text>
            }
          />
        )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 60,
    alignItems: "flex-end",
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  offlineNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  offlineNoteIcon: { fontSize: 16, marginTop: 1 },
  offlineNoteText: { flex: 1, fontSize: 13, lineHeight: 18 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  browseBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  list: { padding: 16, gap: 12 },
  listHeader: { fontSize: 13, marginBottom: 4 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: { fontSize: 11, fontWeight: "700" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: "600" },
  removeBtn: {
    marginLeft: "auto",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", lineHeight: 21 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  footerText: { fontSize: 11 },
  footerDot: { fontSize: 11 },
  savedAt: { fontSize: 11 },
});
