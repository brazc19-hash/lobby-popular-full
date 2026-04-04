import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

type NotifCategory = "all" | "campaigns" | "community" | "achievements" | "congress";

interface Notification {
  id: string;
  type: "campaign_update" | "community_post" | "achievement" | "congress_alert" | "pressure_reply" | "new_supporter";
  title: string;
  body: string;
  time: string;
  read: boolean;
  route?: string;
  emoji: string;
  color: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "achievement",
    title: "Nova conquista desbloqueada! 🏆",
    body: "Você se tornou Cidadão Ativo — 500 pontos acumulados. Continue engajado!",
    time: "Agora mesmo",
    read: false,
    route: "/gamification",
    emoji: "🏆",
    color: "#F39C12",
  },
  {
    id: "2",
    type: "campaign_update",
    title: "Campanha que você apoia atingiu meta",
    body: "\"Merenda Escolar de Qualidade\" alcançou 50.000 apoios. Pressão enviada aos deputados!",
    time: "2 min atrás",
    read: false,
    route: "/lobbies",
    emoji: "📢",
    color: "#2D7D46",
  },
  {
    id: "3",
    type: "congress_alert",
    title: "Votação importante hoje no Plenário",
    body: "PL 1234/2025 sobre educação básica será votado às 14h. Pressione seus deputados agora.",
    time: "15 min atrás",
    read: false,
    route: "/congress",
    emoji: "🏛️",
    color: "#1E3A5F",
  },
  {
    id: "4",
    type: "community_post",
    title: "Novo post em Saúde Pública SP",
    body: "João Silva postou: \"Conseguimos agendar reunião com o vereador. Precisamos de 10 pessoas!\"",
    time: "1h atrás",
    read: false,
    route: "/communities",
    emoji: "👥",
    color: "#8E44AD",
  },
  {
    id: "5",
    type: "new_supporter",
    title: "Sua campanha ganhou 47 novos apoios",
    body: "\"Ciclofaixa Av. Paulista\" recebeu 47 apoios nas últimas 24h. Total: 2.340 apoios.",
    time: "3h atrás",
    read: true,
    route: "/lobbies",
    emoji: "🤝",
    color: "#1E3A5F",
  },
  {
    id: "6",
    type: "pressure_reply",
    title: "Deputado respondeu sua mensagem",
    body: "Dep. Maria Santos respondeu: \"Obrigada pelo contato. Vou analisar a proposta com atenção.\"",
    time: "5h atrás",
    read: true,
    route: "/press",
    emoji: "📬",
    color: "#E8A020",
  },
  {
    id: "7",
    type: "congress_alert",
    title: "Comissão de Saúde se reúne amanhã",
    body: "A CSSF discutirá o PL de financiamento do SUS. Acompanhe ao vivo na seção Congresso.",
    time: "1 dia atrás",
    read: true,
    route: "/congress",
    emoji: "⚕️",
    color: "#C0392B",
  },
  {
    id: "8",
    type: "campaign_update",
    title: "Campanha aliada precisa de apoio",
    body: "\"Reforma da Licitação\" está a 1.200 apoios da meta. Você pode fazer a diferença!",
    time: "2 dias atrás",
    read: true,
    route: "/lobbies",
    emoji: "⚡",
    color: "#E8A020",
  },
  {
    id: "9",
    type: "achievement",
    title: "Você subiu para o nível 3!",
    body: "Parabéns! Você é agora um Ativista Popular. Novos recursos foram desbloqueados.",
    time: "3 dias atrás",
    read: true,
    route: "/gamification",
    emoji: "⭐",
    color: "#F39C12",
  },
  {
    id: "10",
    type: "community_post",
    title: "Você foi mencionado em Educação RJ",
    body: "Ana Lima mencionou você: \"@você tem experiência com petições para a Câmara Municipal?\"",
    time: "4 dias atrás",
    read: true,
    route: "/communities",
    emoji: "💬",
    color: "#8E44AD",
  },
];

const CATEGORIES: { id: NotifCategory; label: string; emoji: string }[] = [
  { id: "all", label: "Todas", emoji: "🔔" },
  { id: "campaigns", label: "Campanhas", emoji: "📢" },
  { id: "community", label: "Comunidades", emoji: "👥" },
  { id: "achievements", label: "Conquistas", emoji: "🏆" },
  { id: "congress", label: "Congresso", emoji: "🏛️" },
];

const NOTIF_PREFS_KEY = "@populus:notif_prefs";

export default function NotificationsScreen() {
  const colors = useColors();
  const goBack = useSmartBack("/(tabs)");
  const [activeCategory, setActiveCategory] = useState<NotifCategory>("all");
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({
    campaigns: true,
    community: true,
    achievements: true,
    congress: true,
    pressureReplies: true,
  });

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_PREFS_KEY).then((val) => {
      if (val) setPrefs(JSON.parse(val));
    });
  }, []);

  const savePrefs = async (newPrefs: typeof prefs) => {
    setPrefs(newPrefs);
    await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(newPrefs));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const filtered = notifications.filter((n) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "campaigns") return n.type === "campaign_update" || n.type === "new_supporter";
    if (activeCategory === "community") return n.type === "community_post";
    if (activeCategory === "achievements") return n.type === "achievement";
    if (activeCategory === "congress") return n.type === "congress_alert";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotif = ({ item }: { item: Notification }) => (
    <Pressable
      onPress={() => {
        markRead(item.id);
        if (item.route) router.push(item.route as never);
      }}
      style={({ pressed }) => [
        styles.notifItem,
        {
          backgroundColor: item.read ? colors.background : colors.highlight,
          borderLeftColor: item.color,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.notifIconWrap, { backgroundColor: item.color + "20" }]}>
        <Text style={styles.notifEmoji}>{item.emoji}</Text>
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text
            style={[styles.notifTitle, { color: colors.foreground, fontWeight: item.read ? "500" : "700" }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!item.read && <View style={[styles.unreadDot, { backgroundColor: item.color }]} />}
        </View>
        <Text style={[styles.notifBody, { color: colors.muted }]} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={[styles.notifTime, { color: colors.muted }]}>{item.time}</Text>
      </View>
      <IconSymbol name="chevron.right" size={14} color={colors.muted} />
    </Pressable>
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <BackButton onPress={goBack} variant="dark" label="Voltar" />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notificações</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={() => setShowPrefs(!showPrefs)}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
        >
          <IconSymbol name="gearshape.fill" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Preferences Panel */}
      {showPrefs && (
        <View style={[styles.prefsPanel, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.prefsTitle, { color: colors.foreground }]}>Preferências de Notificação</Text>
          {[
            { key: "campaigns", label: "Atualizações de campanhas", emoji: "📢" },
            { key: "community", label: "Posts em comunidades", emoji: "👥" },
            { key: "achievements", label: "Conquistas e pontos", emoji: "🏆" },
            { key: "congress", label: "Alertas do Congresso", emoji: "🏛️" },
            { key: "pressureReplies", label: "Respostas de parlamentares", emoji: "📬" },
          ].map((pref) => (
            <View key={pref.key} style={[styles.prefRow, { borderBottomColor: colors.border }]}>
              <Text style={styles.prefEmoji}>{pref.emoji}</Text>
              <Text style={[styles.prefLabel, { color: colors.foreground }]}>{pref.label}</Text>
              <Switch
                value={prefs[pref.key as keyof typeof prefs]}
                onValueChange={(val) => savePrefs({ ...prefs, [pref.key]: val })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>
      )}

      {/* Categories */}
      <View style={[styles.categoriesWrap, { borderBottomColor: colors.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const isActive = activeCategory === item.id;
            return (
              <Pressable
                onPress={() => setActiveCategory(item.id)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                <Text style={[styles.categoryLabel, { color: isActive ? "#FFFFFF" : colors.muted }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Actions bar */}
      {unreadCount > 0 && (
        <Pressable
          onPress={markAllRead}
          style={({ pressed }) => [
            styles.markAllBar,
            { backgroundColor: colors.highlight, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <IconSymbol name="checkmark.circle.fill" size={16} color={colors.primary} />
          <Text style={[styles.markAllText, { color: colors.primary }]}>
            Marcar todas como lidas ({unreadCount})
          </Text>
        </Pressable>
      )}

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderNotif}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔕</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhuma notificação</Text>
            <Text style={[styles.emptyBody, { color: colors.muted }]}>
              Apoie campanhas e participe de comunidades para receber atualizações aqui.
            </Text>
          </View>
        }
      />
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
    paddingBottom: 16,
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  unreadBadge: {
    backgroundColor: "#E8A020",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  unreadBadgeText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  headerBtn: { padding: 4 },
  prefsPanel: {
    padding: 16,
    borderBottomWidth: 1,
    gap: 4,
  },
  prefsTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  prefEmoji: { fontSize: 18, width: 28 },
  prefLabel: { flex: 1, fontSize: 14 },
  categoriesWrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  categoriesList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryEmoji: { fontSize: 14 },
  categoryLabel: { fontSize: 13, fontWeight: "600" },
  markAllBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  markAllText: { fontSize: 13, fontWeight: "600" },
  list: { paddingBottom: 40 },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 3,
  },
  notifIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  notifEmoji: { fontSize: 20 },
  notifContent: { flex: 1, gap: 3 },
  notifHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  notifTitle: { flex: 1, fontSize: 14, lineHeight: 20 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  notifBody: { fontSize: 13, lineHeight: 18 },
  notifTime: { fontSize: 11, marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyBody: { fontSize: 14, lineHeight: 22, textAlign: "center" },
});
