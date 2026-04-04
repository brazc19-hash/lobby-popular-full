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
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Auth from "@/lib/_core/auth";
import * as Api from "@/lib/_core/api";

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function LoginGovBrScreen() {
  const colors = useColors();
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"cpf" | "name">("cpf");

  const loginMutation = trpc.auth.loginGovBr.useMutation({
    onSuccess: async (data) => {
      // Store session token for native
      if (Platform.OS !== "web") {
        await Auth.setSessionToken(data.sessionToken);
      } else {
        // Web: establish session cookie via API
        await Api.establishSession(data.sessionToken);
      }
      // Store user info
      await Auth.setUserInfo({
        id: data.user.id ?? 0,
        openId: data.user.openId,
        name: data.user.name,
        email: data.user.email,
        loginMethod: data.user.loginMethod,
        lastSignedIn: new Date(),
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      // Navigate to home
      router.replace("/(tabs)");
    },
    onError: (err) => {
      Alert.alert("Erro no login", err.message);
    },
  });

  const handleCpfNext = () => {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) {
      Alert.alert("CPF inválido", "Digite os 11 dígitos do seu CPF.");
      return;
    }
    setStep("name");
  };

  const handleLogin = () => {
    if (name.trim().length < 2) {
      Alert.alert("Nome inválido", "Digite seu nome completo.");
      return;
    }
    loginMutation.mutate({
      cpf: cpf.replace(/\D/g, ""),
      name: name.trim(),
      email: email.trim() || undefined,
    });
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header Gov.br */}
      <View style={[styles.header, { backgroundColor: "#1351B4" }]}>
        <BackButton label="Voltar" variant="light" onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <Text style={styles.govbrLogo}>gov.br</Text>
          <Text style={styles.headerSubtitle}>Login com conta Gov.br</Text>
        </View>
        <View style={{ width: 80 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Gov.br badge */}
          <View style={[styles.badge, { backgroundColor: "#1351B4" + "15", borderColor: "#1351B4" + "40" }]}>
            <Text style={styles.badgeIcon}>🇧🇷</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.badgeTitle, { color: "#1351B4" }]}>
                Acesso Gov.br — Simulado
              </Text>
              <Text style={[styles.badgeDesc, { color: colors.muted }]}>
                Esta é uma versão simulada do login Gov.br para testes. Em produção, será integrado ao sistema oficial do governo federal.
              </Text>
            </View>
          </View>

          {step === "cpf" ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Informe seu CPF
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
                Seu CPF é usado como identificador único no Gov.br
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder="000.000.000-00"
                placeholderTextColor={colors.muted}
                value={cpf}
                onChangeText={(t) => setCpf(formatCPF(t))}
                keyboardType="numeric"
                maxLength={14}
                returnKeyType="next"
                onSubmitEditing={handleCpfNext}
                autoFocus
              />
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  { backgroundColor: "#1351B4", opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleCpfNext}
              >
                <Text style={styles.btnText}>Continuar</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Confirme seus dados
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
                CPF: {cpf}
              </Text>

              <Text style={[styles.label, { color: colors.foreground }]}>Nome completo *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Seu nome completo"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                autoFocus
              />

              <Text style={[styles.label, { color: colors.foreground }]}>E-mail (opcional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder="seu@email.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  { backgroundColor: "#1351B4", opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleLogin}
                disabled={loginMutation.isPending}
              >
                <Text style={styles.btnText}>
                  {loginMutation.isPending ? "Entrando..." : "Entrar no Populus"}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.backStep, { opacity: pressed ? 0.6 : 1 }]}
                onPress={() => setStep("cpf")}
              >
                <Text style={[styles.backStepText, { color: colors.muted }]}>← Corrigir CPF</Text>
              </Pressable>
            </View>
          )}

          {/* Security notice */}
          <View style={[styles.securityNote, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={[styles.securityText, { color: colors.muted }]}>
              Seus dados são protegidos pela LGPD. O CPF é armazenado de forma criptografada e nunca é compartilhado com terceiros.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerCenter: {
    alignItems: "center",
  },
  govbrLogo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: -4,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    letterSpacing: 1,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  backStep: {
    alignItems: "center",
    paddingVertical: 8,
  },
  backStepText: {
    fontSize: 13,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  securityIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
