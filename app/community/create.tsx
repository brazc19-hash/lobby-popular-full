import { useState } from "react";
import {
  ActivityIndicator,
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
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

const THEMES = [
  "Administração Pública",
  "Saúde",
  "Educação",
  "Urbanismo",
  "Meio Ambiente",
  "Segurança",
  "Economia",
  "Participação Política",
  "Transporte",
  "Habitação",
  "Cultura",
  "Tecnologia",
];

export default function CreateCommunityScreen() {
  const colors = useColors();
  const { isAuthenticated, startOAuthLogin } = useAuth();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");

  const createMutation = trpc.communities.create.useMutation({
    onSuccess: (data) => {
      utils.communities.list.invalidate();
      Alert.alert(
        "Comunidade Criada!",
        "Sua comunidade foi criada com sucesso.",
        [{ text: "Ver Comunidade", onPress: () => router.push(`/community/${data.id}`) }]
      );
    },
    onError: (err) => {
      Alert.alert("Erro", err.message || "Não foi possível criar a comunidade.");
    },
  });

  const handleCreate = () => {
    if (!name.trim() || name.trim().length < 3) {
      Alert.alert("Nome inválido", "O nome deve ter pelo menos 3 caracteres.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      Alert.alert("Descrição inválida", "A descrição deve ter pelo menos 10 caracteres.");
      return;
    }
    if (!selectedTheme) {
      Alert.alert("Tema obrigatório", "Selecione um tema para sua comunidade.");
      return;
    }
    createMutation.mutate({ name: name.trim(), description: description.trim(), theme: selectedTheme });
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Criar Comunidade</Text>
        </View>
        <View style={styles.loginPrompt}>
          <Pressable onPress={startOAuthLogin} style={[styles.loginBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.loginBtnText}>Fazer Login para Continuar</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Criar Comunidade</Text>
            <Text style={styles.headerSubtitle}>Reúna pessoas com objetivos comuns</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Nome da Comunidade *</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              placeholder="Ex: Iluminação Pública do Bairro Centro"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              maxLength={255}
            />
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Descrição *</Text>
            <TextInput
              style={[styles.textArea, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              placeholder="Descreva o propósito desta comunidade..."
              placeholderTextColor={colors.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Theme */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Tema *</Text>
            <View style={styles.themesGrid}>
              {THEMES.map(theme => (
                <Pressable
                  key={theme}
                  onPress={() => setSelectedTheme(theme)}
                  style={[
                    styles.themeChip,
                    {
                      backgroundColor: selectedTheme === theme ? colors.primary : colors.surface,
                      borderColor: selectedTheme === theme ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[
                    styles.themeChipText,
                    { color: selectedTheme === theme ? "#FFFFFF" : colors.muted },
                  ]}>
                    {theme}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleCreate}
            disabled={createMutation.isPending}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: colors.primary, opacity: pressed || createMutation.isPending ? 0.8 : 1 },
            ]}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol name="person.3.fill" size={20} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Criar Comunidade</Text>
              </>
            )}
          </Pressable>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  loginPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loginBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
  },
  themesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  themeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 17,
  },
});
