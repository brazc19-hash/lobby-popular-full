import { useState, useRef } from "react";
import {
  Alert,
  Animated,
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
import * as Auth from "@/lib/_core/auth";
import * as Api from "@/lib/_core/api";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Tab = "email" | "govbr";
type EmailMode = "login" | "register";

// ─── Helpers ───────────────────────────────────────────────────────────────────
async function persistSession(
  sessionToken: string,
  user: { id: number | null; openId: string; name: string | null; email: string | null; loginMethod: string | null },
) {
  if (Platform.OS !== "web") {
    await Auth.setSessionToken(sessionToken);
  } else {
    await Api.establishSession(sessionToken);
  }
  await Auth.setUserInfo({
    id: user.id ?? 0,
    openId: user.openId,
    name: user.name,
    email: user.email,
    loginMethod: user.loginMethod,
    lastSignedIn: new Date(),
  });
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

// ─── Email Login/Register Panel ────────────────────────────────────────────────
function EmailPanel({ onSuccess }: { onSuccess: () => void }) {
  const colors = useColors();
  const [mode, setMode] = useState<EmailMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const loginMutation = trpc.auth.loginEmail.useMutation({
    onSuccess: async (data) => {
      await persistSession(data.sessionToken, data.user);
      onSuccess();
    },
    onError: (err) => Alert.alert("Erro no login", err.message),
  });

  const registerMutation = trpc.auth.registerEmail.useMutation({
    onSuccess: async (data) => {
      await persistSession(data.sessionToken, data.user);
      onSuccess();
    },
    onError: (err) => Alert.alert("Erro no cadastro", err.message),
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = () => {
    if (mode === "login") {
      if (!email.trim() || !password) {
        Alert.alert("Campos obrigatórios", "Preencha e-mail e senha.");
        return;
      }
      loginMutation.mutate({ email: email.trim(), password });
    } else {
      if (!name.trim() || !email.trim() || !password) {
        Alert.alert("Campos obrigatórios", "Preencha todos os campos.");
        return;
      }
      if (password.length < 6) {
        Alert.alert("Senha fraca", "A senha deve ter pelo menos 6 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Senhas diferentes", "A confirmação de senha não coincide.");
        return;
      }
      registerMutation.mutate({ name: name.trim(), email: email.trim(), password });
    }
  };

  return (
    <View style={styles.panel}>
      {/* Mode toggle */}
      <View style={[styles.modeToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === "login" && { backgroundColor: colors.primary }]}
          onPress={() => setMode("login")}
        >
          <Text style={[styles.modeBtnText, { color: mode === "login" ? "#fff" : colors.muted }]}>
            Entrar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === "register" && { backgroundColor: colors.primary }]}
          onPress={() => setMode("register")}
        >
          <Text style={[styles.modeBtnText, { color: mode === "register" ? "#fff" : colors.muted }]}>
            Criar conta
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fields */}
      {mode === "register" && (
        <>
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
        </>
      )}

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

      <Text style={[styles.label, { color: colors.foreground }]}>Senha *</Text>
      <View style={[styles.passwordRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          style={[styles.passwordInput, { color: colors.foreground }]}
          placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"}
          placeholderTextColor={colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPass}
          returnKeyType={mode === "register" ? "next" : "done"}
          onSubmitEditing={mode === "login" ? handleSubmit : undefined}
        />
        <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{showPass ? "Ocultar" : "Mostrar"}</Text>
        </TouchableOpacity>
      </View>

      {mode === "register" && (
        <>
          <Text style={[styles.label, { color: colors.foreground }]}>Confirmar senha *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Repita a senha"
            placeholderTextColor={colors.muted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPass}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </>
      )}

           <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: isPending ? 0.7 : 1 }]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        <Text style={styles.primaryBtnText}>
          {isPending
            ? mode === "login" ? "Entrando..." : "Criando conta..."
            : mode === "login" ? "Entrar" : "Criar conta"}
        </Text>
      </TouchableOpacity>

      <Text style={[styles.hint, { color: colors.muted }]}>
        {mode === "login"
          ? "Não tem conta? Toque em \"Criar conta\" acima."
          : "Já tem conta? Toque em \"Entrar\" acima."}
      </Text>

      <TouchableOpacity onPress={() => router.push("/forgot-password")} style={{ marginTop: 12 }}>
        <Text style={{ color: colors.primary, textAlign: "center" }}>
          Esqueci minha senha
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Gov.br Panel ──────────────────────────────────────────────────────────────
function GovBrPanel({ onSuccess }: { onSuccess: () => void }) {
  const colors = useColors();
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"cpf" | "name">("cpf");

  const loginMutation = trpc.auth.loginGovBr.useMutation({
    onSuccess: async (data) => {
      await persistSession(data.sessionToken, data.user);
      onSuccess();
    },
    onError: (err) => Alert.alert("Erro no login Gov.br", err.message),
  });

  const formatCpf = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  };

  const handleCpfNext = () => {
    if (cpf.replace(/\D/g, "").length !== 11) {
      Alert.alert("CPF inválido", "Digite os 11 dígitos do seu CPF.");
      return;
    }
    setStep("name");
  };

  const handleLogin = () => {
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Informe seu nome completo.");
      return;
    }
    loginMutation.mutate({ cpf, name: name.trim(), email: email.trim() || undefined });
  };

  return (
    <View style={styles.panel}>
      {/* Gov.br badge */}
      <View style={[styles.govBrBadge, { backgroundColor: "#1351B4" }]}>
        <Text style={styles.govBrLogo}>gov.br</Text>
        <Text style={styles.govBrSub}>Identidade Digital do Cidadão</Text>
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.infoText, { color: colors.muted }]}>
          🔒 O CPF é armazenado de forma criptografada e nunca é compartilhado com terceiros, conforme a LGPD.
        </Text>
      </View>

      {step === "cpf" ? (
        <>
          <Text style={[styles.label, { color: colors.foreground }]}>CPF *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, letterSpacing: 1 }]}
            placeholder="000.000.000-00"
            placeholderTextColor={colors.muted}
            value={cpf}
            onChangeText={(v) => setCpf(formatCpf(v))}
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={handleCpfNext}
            maxLength={14}
          />
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: "#1351B4" }]}
            onPress={handleCpfNext}
          >
            <Text style={styles.primaryBtnText}>Continuar</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={[styles.cardSubtitle, { color: colors.muted }]}>CPF: {cpf}</Text>

          <Text style={[styles.label, { color: colors.foreground }]}>Nome completo *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
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
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder="seu@email.com"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: "#1351B4", opacity: loginMutation.isPending ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}
          >
            <Text style={styles.primaryBtnText}>
              {loginMutation.isPending ? "Entrando..." : "Entrar com Gov.br"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep("cpf")}
          >
            <Text style={[styles.backBtnText, { color: colors.muted }]}>← Corrigir CPF</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("email");

  const handleSuccess = () => {
    router.replace("/(tabs)");
  };

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
            <Text style={[styles.title, { color: colors.foreground }]}>Bem-vindo ao Populus</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Escolha como deseja entrar ou criar sua conta
            </Text>
          </View>

          {/* Tab bar */}
          <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "email" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setTab("email")}
            >
              <Text style={[styles.tabBtnText, { color: tab === "email" ? colors.primary : colors.muted }]}>
                📧 E-mail
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "govbr" && { borderBottomColor: "#1351B4", borderBottomWidth: 2 }]}
              onPress={() => setTab("govbr")}
            >
              <Text style={[styles.tabBtnText, { color: tab === "govbr" ? "#1351B4" : colors.muted }]}>
                🏛️ Gov.br
              </Text>
            </TouchableOpacity>
          </View>

          {/* Panel */}
          {tab === "email" ? (
            <EmailPanel onSuccess={handleSuccess} />
          ) : (
            <GovBrPanel onSuccess={handleSuccess} />
          )}

          {/* Contact link */}
          <View style={styles.contactRow}>
            <Text style={[styles.contactText, { color: colors.muted }]}>
              Quer testar o app?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/contact" as any)}>
              <Text style={[styles.contactLink, { color: colors.primary }]}>
                Cadastre seu interesse
              </Text>
            </TouchableOpacity>
          </View>
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
    alignItems: "center",
    marginBottom: 24,
    gap: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  panel: {
    gap: 12,
  },
  modeToggle: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: "600",
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
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeBtn: {
    paddingLeft: 8,
    paddingVertical: 12,
  },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  hint: {
    fontSize: 12,
    textAlign: "center",
    marginTop: -4,
  },
  govBrBadge: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 2,
  },
  govBrLogo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  govBrSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
  },
  infoBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 17,
  },
  cardSubtitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  backBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 13,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    flexWrap: "wrap",
  },
  contactText: {
    fontSize: 13,
  },
  contactLink: {
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
