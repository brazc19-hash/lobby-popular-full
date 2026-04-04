import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useSmartBack } from "@/hooks/use-smart-back";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BackButton } from "@/components/ui/back-button";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const SUGGESTED_QUESTIONS = [
  "Como crio uma campanha que realmente funciona?",
  "O que é fundamento legal e por que preciso dele?",
  "Como pressiono um deputado de forma eficaz?",
  "Qual artigo da CF garante o direito à saúde?",
  "Como funciona o sistema de gamificação?",
  "Quantos apoios preciso para uma audiência pública?",
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function HelpChatScreen() {
  const colors = useColors();
  const goBack = useSmartBack();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! Sou o Assistente Populus 🤖\n\nEstou aqui para tirar suas dúvidas sobre como usar o app, criar campanhas, pressionar parlamentares e entender seus direitos constitucionais.\n\nComo posso ajudar você hoje?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);

  const chatMutation = trpc.populus.chat.useMutation();

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chatMutation.isPending) return;

    setShowSuggestions(false);
    setInputText("");

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Scroll para o final
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Montar histórico para a IA (excluindo a mensagem de boas-vindas)
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await chatMutation.mutateAsync({
        messages: [...history, { role: "user", content: trimmed }],
      });

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Desculpe, tive um problema ao processar sua pergunta. Tente novamente em instantes.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: "#1E3A5F" }]}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.bubbleUser, { backgroundColor: "#1E3A5F" }]
              : [styles.bubbleAssistant, { backgroundColor: colors.surface, borderColor: colors.border }],
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              { color: isUser ? "#FFFFFF" : colors.foreground },
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.bubbleTime,
              { color: isUser ? "rgba(255,255,255,0.6)" : colors.muted },
            ]}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1E3A5F", paddingTop: insets.top + 8 }]}>
        <BackButton onPress={goBack} variant="dark" label="Voltar" />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Assistente Populus</Text>
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
        <View style={styles.headerIcon}>
          <Text style={{ fontSize: 28 }}>🤖</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={[styles.messageList, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            chatMutation.isPending ? (
              <View style={styles.typingRow}>
                <View style={[styles.avatar, { backgroundColor: "#1E3A5F" }]}>
                  <Text style={styles.avatarText}>🤖</Text>
                </View>
                <View style={[styles.typingBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <ActivityIndicator size="small" color="#1E3A5F" />
                  <Text style={[styles.typingText, { color: colors.muted }]}>Digitando...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Sugestões de perguntas */}
        {showSuggestions && (
          <View style={styles.suggestionsContainer}>
            <Text style={[styles.suggestionsTitle, { color: colors.muted }]}>Perguntas frequentes:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsList}>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <Pressable
                  key={i}
                  onPress={() => sendMessage(q)}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.suggestionText, { color: colors.foreground }]}>{q}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
            ]}
            placeholder="Pergunte algo ao Assistente Populus..."
            placeholderTextColor={colors.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(inputText)}
          />
          <Pressable
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || chatMutation.isPending}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: inputText.trim() && !chatMutation.isPending ? "#1E3A5F" : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <IconSymbol name="paperplane.fill" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerContent: { flex: 1 },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  onlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#4ADE80",
  },
  onlineText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  headerIcon: { width: 40, alignItems: "center" },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 8,
  },
  messageRowUser: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarText: { fontSize: 16 },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    padding: 12,
    gap: 4,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTime: {
    fontSize: 11,
    alignSelf: "flex-end",
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingText: { fontSize: 14 },
  suggestionsContainer: {
    paddingTop: 8,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  suggestionsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 220,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    lineHeight: 22,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
});
