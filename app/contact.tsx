import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

// ─── Constants ─────────────────────────────────────────────────────────────────
const INTEREST_OPTIONS = [
  { value: "infrastructure", label: "🏗️ Infraestrutura" },
  { value: "education", label: "📚 Educação" },
  { value: "health", label: "🏥 Saúde" },
  { value: "security", label: "🛡️ Segurança" },
  { value: "environment", label: "🌿 Meio Ambiente" },
  { value: "human_rights", label: "✊ Direitos Humanos" },
  { value: "economy", label: "💰 Economia" },
  { value: "transparency", label: "👁️ Transparência" },
  { value: "culture", label: "🎭 Cultura" },
  { value: "technology", label: "💻 Tecnologia" },
];

const TYPE_OPTIONS = [
  { value: "tester", label: "🧪 Quero testar o app" },
  { value: "partner", label: "🤝 Parceria / Organização" },
  { value: "press", label: "📰 Imprensa" },
  { value: "other", label: "💬 Outro" },
] as const;

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ContactScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState<"tester" | "partner" | "press" | "other">("tester");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setSubmitted(true);
    },
    onError: (err) => Alert.alert("Erro ao enviar", err.message),
  });

  const toggleInterest = (value: string) => {
    setSelectedInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Campos obrigatórios", "Preencha nome e e-mail.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("E-mail inválido", "Digite um e-mail válido.");
      return;
    }
    submitMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      state: state || undefined,
      city: city.trim() || undefined,
      interests: selectedInterests,
      message: message.trim() || undefined,
      type,
    });
  };

  if (submitted) {
    return (
      <ScreenContainer>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>
            Cadastro recebido!
          </Text>
          <Text style={[styles.successText, { color: colors.muted }]}>
            Obrigado pelo interesse no Populus! Entraremos em contato em breve com as próximas etapas.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.primaryBtnText}>Ir para o app</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
              onPress={() => router.push("/login" as any)}>
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                Já tenho conta — Entrar
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Cadastre seu interesse
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Preencha o formulário abaixo para participar do programa de testes do Populus.
            </Text>
          </View>

          {/* Type selector */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tipo de interesse</Text>
          <View style={styles.typeGrid}>
            {TYPE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: type === opt.value ? colors.primary : colors.surface,
                    borderColor: type === opt.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setType(opt.value)}
              >
                <Text style={[styles.typeChipText, { color: type === opt.value ? "#fff" : colors.foreground }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Personal info */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Seus dados</Text>

          <Text style={[styles.label, { color: colors.foreground }]}>Nome completo *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Seu nome completo"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: colors.foreground }]}>E-mail *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder="seu@email.com"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Telefone / WhatsApp</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder="(00) 00000-0000"
            placeholderTextColor={colors.muted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="next"
          />

          {/* Location */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Localização</Text>

          <Text style={[styles.label, { color: colors.foreground }]}>Estado</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.stateScroll}
            contentContainerStyle={styles.stateScrollContent}
          >
            {STATES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.stateChip,
                  {
                    backgroundColor: state === s ? colors.primary : colors.surface,
                    borderColor: state === s ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setState(state === s ? "" : s)}
              >
                <Text style={[styles.stateChipText, { color: state === s ? "#fff" : colors.foreground }]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: colors.foreground }]}>Cidade</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Sua cidade"
            placeholderTextColor={colors.muted}
            value={city}
            onChangeText={setCity}
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* Interests */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Temas de interesse</Text>
          <Text style={[styles.hint, { color: colors.muted }]}>Selecione todos que se aplicam</Text>
          <View style={styles.interestGrid}>
            {INTEREST_OPTIONS.map((opt) => {
              const selected = selectedInterests.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.interestChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => toggleInterest(opt.value)}
                >
                  <Text style={[styles.interestChipText, { color: selected ? "#fff" : colors.foreground }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Message */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mensagem (opcional)</Text>
          <TextInput
            style={[
              styles.input,
              styles.textarea,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="Conte um pouco sobre você ou sua organização..."
            placeholderTextColor={colors.muted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: submitMutation.isPending ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={submitMutation.isPending}
          >
            <Text style={styles.primaryBtnText}>
              {submitMutation.isPending ? "Enviando..." : "Enviar cadastro"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backBtnText, { color: colors.muted }]}>← Voltar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 40,
    gap: 0,
  },
  header: {
    marginBottom: 24,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textarea: {
    minHeight: 100,
    paddingTop: 12,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  stateScroll: {
    marginBottom: 4,
  },
  stateScrollContent: {
    gap: 6,
    paddingVertical: 4,
  },
  stateChip: {
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  stateChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  interestGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestChip: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  interestChipText: {
    fontSize: 13,
  },
  hint: {
    fontSize: 12,
    marginBottom: 8,
    marginTop: -4,
  },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  backBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 13,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  successEmoji: {
    fontSize: 64,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  successText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
