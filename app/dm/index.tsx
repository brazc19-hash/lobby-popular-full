import { useRouter, Stack } from "expo-router";
import React from "react";
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";

export default function DMInboxScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();
  const goBack = useSmartBack("/(tabs)");

  const { data: conversations, isLoading } = trpc.dms.conversations.useQuery(undefined, { enabled: !!user });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <BackButton onPress={goBack} label="Voltar" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Mensagens Diretas</Text>
          <View style={{ width: 80 }} />
        </View>

        {!user ? (
          <View style={styles.center}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>Faça login para ver suas mensagens.</Text>
          </View>
        ) : isLoading ? (
          <ActivityIndicator style={styles.center} color={colors.primary} />
        ) : (
          <FlatList
            data={conversations ?? []}
            keyExtractor={(item) => String(item.partnerId)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>Nenhuma conversa ainda.</Text>
                <Text style={[styles.emptyHint, { color: colors.muted }]}>Visite o perfil de um usuário para iniciar uma conversa.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
                onPress={() => router.push({ pathname: "/dm/[id]", params: { id: String(item.partnerId), name: item.partnerName ?? "Usuário" } })}
              >
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>{(item.partnerName ?? "?")[0].toUpperCase()}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.partnerName, { color: colors.foreground }]}>{item.partnerName ?? "Usuário"}</Text>
                  <Text style={[styles.lastMessage, { color: colors.muted }]} numberOfLines={1}>{item.lastMessage}</Text>
                </View>
                <Text style={[styles.time, { color: colors.muted }]}>
                  {new Date(item.lastAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </Text>
              </Pressable>
            )}
          />
        )}
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  list: { padding: 16, gap: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  emptyHint: { fontSize: 13, textAlign: "center", marginTop: 8 },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 12, borderWidth: 1, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cardContent: { flex: 1 },
  partnerName: { fontSize: 15, fontWeight: "600" },
  lastMessage: { fontSize: 13, marginTop: 2 },
  time: { fontSize: 11 },
});
