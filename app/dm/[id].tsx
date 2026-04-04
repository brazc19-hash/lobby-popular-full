import { useLocalSearchParams, Stack, router } from "expo-router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useSocket } from "@/hooks/use-socket";

type DMMessage = {
  id: number;
  senderId: number;
  senderName?: string;
  receiverId: number;
  content: string;
  readAt?: Date | null;
  createdAt: string | Date;
};

export default function DMScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const partnerId = Number(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sendDM, onDM, onDMSent, isConnected } = useSocket();

  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const { data: historicMessages, isLoading } = trpc.dms.messages.useQuery(
    { partnerId },
    { enabled: !!partnerId && !!user },
  );

  useEffect(() => {
    if (historicMessages) {
      setMessages((historicMessages as DMMessage[]).slice().reverse());
    }
  }, [historicMessages]);

  useEffect(() => {
    const offDM = onDM((msg) => {
      if (msg.senderId === partnerId || msg.receiverId === partnerId) {
        setMessages((prev) => [...prev, msg as DMMessage]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });
    const offSent = onDMSent((msg) => {
      setMessages((prev) => [...prev, msg as DMMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => { offDM(); offSent(); };
  }, [onDM, onDMSent, partnerId]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || !user) return;
    sendDM(partnerId, text);
    setInputText("");
  }, [inputText, user, partnerId, sendDM]);

  const renderMessage = useCallback(({ item }: { item: DMMessage }) => {
    const isOwn = item.senderId === user?.id;
    const time = new Date(item.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        <View style={[
          styles.bubble,
          isOwn
            ? [styles.bubbleOwn, { backgroundColor: colors.primary }]
            : [styles.bubbleOther, { backgroundColor: colors.surface, borderColor: colors.border }],
        ]}>
          <Text style={[styles.messageText, { color: isOwn ? "#fff" : colors.foreground }]}>{item.content}</Text>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: isOwn ? "rgba(255,255,255,0.7)" : colors.muted }]}>{time}</Text>
            {isOwn && item.readAt && <Text style={styles.readCheck}>✓✓</Text>}
          </View>
        </View>
      </View>
    );
  }, [user?.id, colors]);

  return (
    <>
      <Stack.Screen
        options={{
          title: name ?? "Mensagem Direta",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 4, opacity: pressed ? 0.6 : 1, paddingRight: 8 })}
            >
              <Text style={{ color: colors.primary, fontSize: 22, fontWeight: "400", lineHeight: 26 }}>←</Text>
              <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>Conversas</Text>
            </Pressable>
          ),
          headerRight: () => (
            <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.success : colors.error }]} />
          ),
        }}
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>Nenhuma mensagem ainda. Inicie a conversa!</Text>
              </View>
            }
          />
        )}

        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Escreva uma mensagem..."
            placeholderTextColor={colors.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
          />
          <Pressable
            style={({ pressed }) => [styles.sendBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, alignSelf: "center" },
  messageList: { padding: 12, gap: 8 },
  messageRow: { flexDirection: "row", marginBottom: 4 },
  messageRowOwn: { flexDirection: "row-reverse" },
  bubble: { maxWidth: "78%", borderRadius: 16, padding: 10, borderWidth: 1 },
  bubbleOwn: { borderRadius: 16, borderTopRightRadius: 4, borderWidth: 0 },
  bubbleOther: { borderRadius: 16, borderTopLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 21 },
  timeRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 4 },
  timeText: { fontSize: 10 },
  readCheck: { fontSize: 10, color: "#60a5fa" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sendBtnText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
});
