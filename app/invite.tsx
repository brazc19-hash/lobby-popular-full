import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function InviteScreen() {
  const colors = useColors();
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [codeStatus, setCodeStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const useMutation = trpc.invite.use.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Acesso liberado! 🎉",
        "Bem-vindo ao Populus. Seu código de convite foi aceito.",
        [{ text: "Entrar no app", onPress: () => router.replace("/(tabs)") }]
      );
    },
    onError: (err) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setCodeStatus("invalid");
      setErrorMsg(err.message);
    },
  });

  const validateQuery = trpc.invite.validate.useQuery(
    { code: code.trim().toUpperCase() },
    {
      enabled: false,
    }
  );

  async function handleValidate() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setCodeStatus("invalid");
      setErrorMsg("O código deve ter pelo menos 4 caracteres");
      return;
    }
    setValidating(true);
    setCodeStatus("idle");
    setErrorMsg("");
    try {
      const result = await validateQuery.refetch();
      if (result.data?.valid) {
        setCodeStatus("valid");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        setCodeStatus("invalid");
        setErrorMsg(result.data?.reason ?? "Código inválido");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setCodeStatus("invalid");
      setErrorMsg("Erro ao validar o código. Tente novamente.");
    } finally {
      setValidating(false);
    }
  }

  function handleUse() {
    useMutation.mutate({ code: code.trim().toUpperCase() });
  }

  const borderColor =
    codeStatus === "valid"
      ? colors.success
      : codeStatus === "invalid"
      ? colors.error
      : colors.border;

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton />
          </View>

          {/* Conteúdo */}
          <View style={styles.content}>
            {/* Ícone */}
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
              <Text style={styles.icon}>🔑</Text>
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>
              Acesso por Convite
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              O Populus está em fase beta fechada. Insira o código de convite que você recebeu para ter acesso.
            </Text>

            {/* Campo de código */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor,
                    color: colors.foreground,
                  },
                ]}
                placeholder="Ex: POPULUS2025"
                placeholderTextColor={colors.muted}
                value={code}
                onChangeText={(text) => {
                  setCode(text.toUpperCase());
                  setCodeStatus("idle");
                  setErrorMsg("");
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleValidate}
                maxLength={32}
              />

              {codeStatus === "valid" && (
                <View style={styles.validBadge}>
                  <Text style={[styles.validText, { color: colors.success }]}>
                    ✓ Código válido
                  </Text>
                </View>
              )}

              {codeStatus === "invalid" && errorMsg ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errorMsg}
                </Text>
              ) : null}
            </View>

            {/* Botão de validar */}
            {codeStatus !== "valid" ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.primary },
                  (validating || code.trim().length < 4) && { opacity: 0.5 },
                ]}
                onPress={handleValidate}
                disabled={validating || code.trim().length < 4}
                activeOpacity={0.8}
              >
                {validating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Verificar Código</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: colors.success },
                  useMutation.isPending && { opacity: 0.5 },
                ]}
                onPress={handleUse}
                disabled={useMutation.isPending}
                activeOpacity={0.8}
              >
                {useMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Entrar no Populus →</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.muted }]}>ou</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Solicitar convite */}
            <View style={[styles.requestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.requestTitle, { color: colors.foreground }]}>
                Não tem um código?
              </Text>
              <Text style={[styles.requestText, { color: colors.muted }]}>
                O Populus está crescendo gradualmente para garantir a melhor experiência. Entre em contato para solicitar um convite.
              </Text>
              <TouchableOpacity
                style={[styles.requestButton, { borderColor: colors.primary }]}
                onPress={() => router.push("/about")}
                activeOpacity={0.7}
              >
                <Text style={[styles.requestButtonText, { color: colors.primary }]}>
                  Saiba mais sobre o Populus
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 32,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 2,
    textAlign: "center",
  },
  validBadge: {
    marginTop: 8,
    alignItems: "center",
  },
  validText: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    textAlign: "center",
  },
  button: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
  },
  requestCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  requestText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  requestButton: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
