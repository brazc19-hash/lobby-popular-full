import { useState } from "react";
import { ContextualTooltip } from "@/components/contextual-tooltip";
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
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

type LobbyCategory = "national" | "local";

export default function CreateLobbyScreen() {
  const colors = useColors();
  const { isAuthenticated, startOAuthLogin } = useAuth();
  const params = useLocalSearchParams<{ articleId?: string }>();
  const utils = trpc.useUtils();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [category, setCategory] = useState<LobbyCategory>("national");
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(
    params.articleId ? parseInt(params.articleId) : null
  );
  const [showArticlePicker, setShowArticlePicker] = useState(false);
  const [articleSearch, setArticleSearch] = useState("");

  // Local lobby fields
  const [locationAddress, setLocationAddress] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationState, setLocationState] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const { data: articles } = trpc.constitution.list.useQuery();
  const filteredArticles = articles?.filter(a =>
    articleSearch === "" ||
    a.articleNumber.toLowerCase().includes(articleSearch.toLowerCase()) ||
    a.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
    a.theme.toLowerCase().includes(articleSearch.toLowerCase())
  );

  const selectedArticle = articles?.find(a => a.id === selectedArticleId);

  const createMutation = trpc.lobbies.create.useMutation({
    onSuccess: (data) => {
      utils.lobbies.list.invalidate();
      Alert.alert(
        "Lobby Criado!",
        "Sua campanha foi criada com sucesso e está ativo.",
        [{ text: "Ver Lobby", onPress: () => router.push(`/lobby/${data.id}`) }]
      );
    },
    onError: (err) => {
      Alert.alert("Erro", err.message || "Não foi possível criar o lobby.");
    },
  });

  const handleCreate = () => {
    if (!title.trim() || title.trim().length < 5) {
      Alert.alert("Título inválido", "O título deve ter pelo menos 5 caracteres.");
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      Alert.alert("Descrição inválida", "A descrição deve ter pelo menos 20 caracteres.");
      return;
    }
    if (!objective.trim() || objective.trim().length < 10) {
      Alert.alert("Objetivo inválido", "O objetivo deve ter pelo menos 10 caracteres.");
      return;
    }
    if (!selectedArticleId) {
      Alert.alert("Fundamento Legal obrigatório", "Selecione um artigo da Constituição Federal para fundamentar sua campanha.");
      return;
    }
    if (category === "local" && (!latitude || !longitude)) {
      Alert.alert("Localização obrigatória", "Lobbys locais precisam de coordenadas de localização.");
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      objective: objective.trim(),
      category,
      constitutionArticleId: selectedArticleId,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      locationAddress: locationAddress || undefined,
      locationCity: locationCity || undefined,
      locationState: locationState || undefined,
    });
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>Criar Campanha</Text>
        </View>
        <View style={styles.loginPrompt}>
          <View style={[styles.loginCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="megaphone.fill" size={48} color={colors.primary} />
            <Text style={[styles.loginTitle, { color: colors.foreground }]}>
              Login necessário
            </Text>
            <Text style={[styles.loginSubtitle, { color: colors.muted }]}>
              Para criar um lobby, você precisa estar autenticado.
            </Text>
            <Pressable
              onPress={startOAuthLogin}
              style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.loginBtnText}>Fazer Login</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Tooltip contextual de primeira visita */}
        <View style={{ position: "relative" }}>
          <ContextualTooltip
            id="create_lobby_first_visit"
            message="Primeira vez aqui? Dê um título claro, escolha o artigo da CF que embasa sua causa e defina uma meta realista de apoios."
            icon="🎯"
            position="bottom"
            accentColor="#2D7D46"
          />
        </View>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable
            onPress={() => {
              const hasContent = title.trim() || description.trim() || objective.trim();
              if (hasContent) {
                Alert.alert(
                  "Descartar rascunho?",
                  "As informações preenchidas serão perdidas.",
                  [
                    { text: "Continuar editando", style: "cancel" },
                    { text: "Descartar", style: "destructive", onPress: () => router.back() },
                  ]
                );
              } else {
                router.back();
              }
            }}
            style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.cancelBtnText}>← Cancelar</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Criar Campanha</Text>
          <Text style={styles.headerSubtitle}>Inicie uma campanha democrática</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Legal Warning */}
          <View style={[styles.warningBanner, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40" }]}>
            <IconSymbol name="shield.fill" size={16} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.muted }]}>
              Todo lobby deve ser vinculado a um artigo da Constituição Federal. Lobbys sem fundamento legal serão bloqueados.
            </Text>
          </View>

          {/* Category */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Tipo de Lobby *</Text>
            <View style={styles.categoryRow}>
              {(["national", "local"] as LobbyCategory[]).map(cat => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.categoryBtn,
                    {
                      backgroundColor: category === cat ? colors.primary : colors.surface,
                      borderColor: category === cat ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <IconSymbol
                    name={cat === "national" ? "building.columns.fill" : "mappin"}
                    size={18}
                    color={category === cat ? "#FFFFFF" : colors.muted}
                  />
                  <Text style={[styles.categoryBtnText, { color: category === cat ? "#FFFFFF" : colors.muted }]}>
                    {cat === "national" ? "Nacional" : "Local"}
                  </Text>
                  <Text style={[styles.categoryBtnDesc, { color: category === cat ? "rgba(255,255,255,0.8)" : colors.muted }]}>
                    {cat === "national" ? "Leis federais" : "Obras e melhorias"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Título *</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              placeholder="Ex: Reforma da lei de licitações"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
              maxLength={255}
            />
            <Text style={[styles.charCount, { color: colors.muted }]}>{title.length}/255</Text>
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Descrição *</Text>
            <TextInput
              style={[styles.textArea, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              placeholder="Descreva detalhadamente o problema e por que ele precisa ser resolvido..."
              placeholderTextColor={colors.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.muted }]}>{description.length} caracteres (mín. 20)</Text>
          </View>

          {/* Objective */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Objetivo *</Text>
            <TextInput
              style={[styles.textArea, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              placeholder="O que você quer alcançar com este lobby? Seja específico..."
              placeholderTextColor={colors.muted}
              value={objective}
              onChangeText={setObjective}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Constitution Article */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Fundamento Legal — CF/88 *</Text>
            <Pressable
              onPress={() => setShowArticlePicker(!showArticlePicker)}
              style={[
                styles.articleSelector,
                {
                  backgroundColor: selectedArticle ? colors.accent + "10" : colors.surface,
                  borderColor: selectedArticle ? colors.accent + "50" : colors.border,
                },
              ]}
            >
              {selectedArticle ? (
                <View style={styles.selectedArticle}>
                  <IconSymbol name="scale.3d" size={18} color={colors.accent} />
                  <View style={styles.selectedArticleText}>
                    <Text style={[styles.selectedArticleNumber, { color: colors.accent }]}>
                      {selectedArticle.articleNumber}
                    </Text>
                    <Text style={[styles.selectedArticleTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {selectedArticle.title}
                    </Text>
                  </View>
                  <IconSymbol name="xmark" size={16} color={colors.muted} />
                </View>
              ) : (
                <View style={styles.articlePlaceholder}>
                  <IconSymbol name="building.columns.fill" size={18} color={colors.muted} />
                  <Text style={[styles.articlePlaceholderText, { color: colors.muted }]}>
                    Selecionar artigo da Constituição
                  </Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </View>
              )}
            </Pressable>

            {/* Article Picker */}
            {showArticlePicker && (
              <View style={[styles.articlePicker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.articleSearchInput, { color: colors.foreground, borderColor: colors.border }]}
                  placeholder="Buscar artigo..."
                  placeholderTextColor={colors.muted}
                  value={articleSearch}
                  onChangeText={setArticleSearch}
                />
                <ScrollView style={styles.articleList} nestedScrollEnabled>
                  {filteredArticles?.map(article => (
                    <Pressable
                      key={article.id}
                      onPress={() => {
                        setSelectedArticleId(article.id);
                        setShowArticlePicker(false);
                        setArticleSearch("");
                      }}
                      style={({ pressed }) => [
                        styles.articleOption,
                        {
                          backgroundColor: pressed ? colors.primary + "10" : "transparent",
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.articleOptionNumber, { color: colors.primary }]}>
                        {article.articleNumber}
                      </Text>
                      <View style={styles.articleOptionText}>
                        <Text style={[styles.articleOptionTitle, { color: colors.foreground }]} numberOfLines={1}>
                          {article.title}
                        </Text>
                        <Text style={[styles.articleOptionTheme, { color: colors.muted }]}>
                          {article.theme}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Local Lobby Fields */}
          {category === "local" && (
            <View style={[styles.localSection, { backgroundColor: colors.secondary + "08", borderColor: colors.secondary + "30" }]}>
              <View style={styles.localSectionHeader}>
                <IconSymbol name="location.fill" size={18} color={colors.secondary} />
                <Text style={[styles.localSectionTitle, { color: colors.secondary }]}>
                  Localização do Problema
                </Text>
              </View>
              <Text style={[styles.localSectionDesc, { color: colors.muted }]}>
                Informe o endereço e as coordenadas GPS do local onde o problema ocorre.
              </Text>

              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                placeholder="Endereço (ex: Rua das Flores, 123)"
                placeholderTextColor={colors.muted}
                value={locationAddress}
                onChangeText={setLocationAddress}
              />
              <View style={styles.cityStateRow}>
                <TextInput
                  style={[styles.input, styles.cityInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                  placeholder="Cidade"
                  placeholderTextColor={colors.muted}
                  value={locationCity}
                  onChangeText={setLocationCity}
                />
                <TextInput
                  style={[styles.input, styles.stateInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                  placeholder="UF"
                  placeholderTextColor={colors.muted}
                  value={locationState}
                  onChangeText={setLocationState}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>

              <Text style={[styles.fieldLabel, { color: colors.foreground, marginTop: 4 }]}>
                Coordenadas GPS *
              </Text>
              <View style={styles.coordsRow}>
                <TextInput
                  style={[styles.input, styles.coordInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                  placeholder="Latitude (ex: -23.5505)"
                  placeholderTextColor={colors.muted}
                  value={latitude}
                  onChangeText={setLatitude}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.coordInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                  placeholder="Longitude (ex: -46.6333)"
                  placeholderTextColor={colors.muted}
                  value={longitude}
                  onChangeText={setLongitude}
                  keyboardType="numeric"
                />
              </View>
              <Text style={[styles.coordsHint, { color: colors.muted }]}>
                Dica: Você pode obter as coordenadas abrindo o Google Maps e tocando no local desejado.
              </Text>
            </View>
          )}

          {/* Submit */}
          <Pressable
            onPress={handleCreate}
            disabled={createMutation.isPending}
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed || createMutation.isPending ? 0.8 : 1,
              },
            ]}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol name="megaphone.fill" size={20} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Criar Campanha</Text>
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
  },
  loginPrompt: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loginCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  loginSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  loginBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 4,
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
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
  charCount: {
    fontSize: 12,
    textAlign: "right",
  },
  categoryRow: {
    flexDirection: "row",
    gap: 10,
  },
  categoryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  categoryBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  categoryBtnDesc: {
    fontSize: 12,
  },
  articleSelector: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  selectedArticle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectedArticleText: {
    flex: 1,
  },
  selectedArticleNumber: {
    fontSize: 13,
    fontWeight: "800",
  },
  selectedArticleTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  articlePlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  articlePlaceholderText: {
    flex: 1,
    fontSize: 15,
  },
  articlePicker: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    maxHeight: 280,
  },
  articleSearchInput: {
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  articleList: {
    maxHeight: 220,
  },
  articleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  articleOptionNumber: {
    fontSize: 13,
    fontWeight: "800",
    width: 70,
  },
  articleOptionText: {
    flex: 1,
  },
  articleOptionTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  articleOptionTheme: {
    fontSize: 12,
    marginTop: 2,
  },
  localSection: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  localSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  localSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  localSectionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  cityStateRow: {
    flexDirection: "row",
    gap: 10,
  },
  cityInput: {
    flex: 1,
  },
  stateInput: {
    width: 70,
  },
  coordsRow: {
    flexDirection: "row",
    gap: 10,
  },
  coordInput: {
    flex: 1,
  },
  coordsHint: {
    fontSize: 12,
    lineHeight: 17,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 17,
  },
  cancelBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  cancelBtnText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontWeight: "600",
  },
});
