import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const [email, setEmail] = useState("");

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      Alert.alert(
        "E-mail enviado",
        "Se o e-mail existir, você receberá um link para redefinir sua senha."
      );
      router.back();
    },
    onError: (err) => Alert.alert("Erro", err.message),
  });

  const handleSubmit = () => {
    if (!email.trim()) {
      Alert.alert("Campo obrigatório", "Digite seu e-mail.");
      return;
    }
    forgotMutation.mutate({ email: email.trim() });
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20, color: colors.foreground }}>
        Esqueci minha senha
      </Text>
      <Text style={{ marginBottom: 10, color: colors.muted }}>
        Digite seu e-mail cadastrado. Enviaremos um link para redefinir sua senha.
      </Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
          backgroundColor: colors.surface,
          color: colors.foreground,
        }}
        placeholder="seu@email.com"
        placeholderTextColor={colors.muted}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={{ backgroundColor: colors.primary, padding: 14, borderRadius: 8, alignItems: "center" }}
        onPress={handleSubmit}
        disabled={forgotMutation.isPending}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          {forgotMutation.isPending ? "Enviando..." : "Enviar link"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, alignItems: "center" }}>
        <Text style={{ color: colors.primary }}>Voltar para o login</Text>
      </TouchableOpacity>
    </View>
  );
}