import { useLocalSearchParams, useRouter, Stack } from "expo-router";
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

type Message = {
  id: number;
  channelId: number;
  userId: number;
  userName: string | null;
  content: string;
  mentions: string | number[] | null;
  replyToId: number | null;
  isEdited?: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
};

export default function ChannelScreen() {
  const { id, name, communityId } = useLocalSearchParams<{ id: string; name: string; communityId: string }>();
  const channelId = Number(id);
  const commId = Number(communityId);
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { joinChannel, leaveChannel, sendChannelMessage, onChannelMessage, sendTypingStart, sendTypingStop, onUserTyping, onUserStoppedTyping, isConnected } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: historicMessages, isLoading } = trpc.channels.messages.useQuery(
    { channelId, limit: 50 },
    { enabled: !!channelId },
  );

  useEffect(() => {
    if (historicMessages) {
      setMessages(historicMessages as Message[]);
    }
  }, [historicMessages]);

  useEffect(() => {
    if (!channelId || !commId) return;
    joinChannel(channelId, commId);
    return () => leaveChannel(channelId);
  }, [channelId, commId, joinChannel, leaveChannel]);

  useEffect(() => {
    const off = onChannelMessage((msg) => {
      setMessages((prev) => [...prev, msg as Message]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return off;
  }, [onChannelMessage]);

  useEffect(() => {
    const off1 = onUserTyping(({ userId: uid }) => {
      if (uid !== user?.id) setTypingUsers((prev) => new Set([...prev, uid]));
    });
    const off2 = onUserStoppedTyping(({ userId: uid }) => {
      setTypingUsers((prev) => { const s = new Set(prev); s.delete(uid); return s; });
    });
    return () => { off1(); off2(); };
  }, [onUserTyping, onUserStoppedTyping, user?.id]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || !user) return;

    // Parse mentions (@username pattern — simplified)
    const mentions: number[] = [];

    sendChannelMessage(channelId, text, mentions);
    setInputText("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStop(channelId);
  }, [inputText, user, channelId, sendChannelMessage, sendTypingStop]);

  const handleTyping = useCallback((text: string) => {
    setInputText(text);
    if (!user) return;
    sendTypingStart(channelId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingStop(channelId), 2000);
  }, [channelId, sendTypingStart, sendTypingStop, user]);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isOwn = item.userId === user?.id;
    const time = new Date(item.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        {!isOwn && (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{(item.userName ?? "?")[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.bubble, isOwn ? [styles.bubbleOwn, { backgroundColor: colors.primary }] : [styles.bubbleOther, { backgroundColor: colors.surface, borderColor: colors.border }]]}>
          {!isOwn && (
            <Text style={[styles.senderName, { color: colors.primary }]}>{item.userName ?? "Usuário"}</Text>
          )}
          <Text style={[styles.messageText, { color: isOwn ? "#fff" : colors.foreground }]}>{item.content}</Text>
          <Text style={[styles.timeText, { color: isOwn ? "rgba(255,255,255,0.7)" : colors.muted }]}>{time}</Text>
        </View>
      </View>
    );
  }, [user?.id, colors]);

  return (
    <>
      <Stack.Screen
        options={{
          title: `#${name ?? "canal"}`,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 4, opacity: pressed ? 0.6 : 1, paddingRight: 8 })}
            >
              <Text style={{ color: colors.primary, fontSize: 22, fontWeight: "400", lineHeight: 26 }}>←</Text>
              <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>Voltar</Text>
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
                <Text style={[styles.emptyText, { color: colors.muted }]}>Nenhuma mensagem ainda. Seja o primeiro a escrever!</Text>
              </View>
            }
          />
        )}

        {typingUsers.size > 0 && (
          <View style={[styles.typingBar, { backgroundColor: colors.surface }]}>
            <Text style={[styles.typingText, { color: colors.muted }]}>
              {typingUsers.size === 1 ? "Alguém está digitando..." : `${typingUsers.size} pessoas estão digitando...`}
            </Text>
          </View>
        )}

        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder={`Mensagem em #${name ?? "canal"}`}
            placeholderTextColor={colors.muted}
            value={inputText}
            onChangeText={handleTyping}
            multiline
            maxLength={2000}
            returnKeyType="default"
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
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 4 },
  messageRowOwn: { flexDirection: "row-reverse" },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 8 },
  avatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  bubble: { maxWidth: "75%", borderRadius: 16, padding: 10, borderWidth: 1 },
  bubbleOwn: { borderRadius: 16, borderTopRightRadius: 4, borderWidth: 0 },
  bubbleOther: { borderRadius: 16, borderTopLeftRadius: 4 },
  senderName: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  messageText: { fontSize: 15, lineHeight: 20 },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  typingBar: { paddingHorizontal: 16, paddingVertical: 6 },
  typingText: { fontSize: 12, fontStyle: "italic" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  sendBtnText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
});
