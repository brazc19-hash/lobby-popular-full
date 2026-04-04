import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

const CATEGORIES = [
  { id: "infrastructure", label: "Infraestrutura", emoji: "🏗️" },
  { id: "health", label: "Saúde", emoji: "🏥" },
  { id: "education", label: "Educação", emoji: "📚" },
  { id: "security", label: "Segurança", emoji: "🚔" },
  { id: "environment", label: "Meio Ambiente", emoji: "🌿" },
  { id: "transparency", label: "Transparência", emoji: "🔍" },
  { id: "human_rights", label: "Direitos Humanos", emoji: "✊" },
  { id: "economy", label: "Economia", emoji: "💰" },
  { id: "other", label: "Outros", emoji: "📌" },
];

const PROMPTS = [
  "Buraco na rua há meses sem conserto...",
  "Posto de saúde fechado sem aviso...",
  "Escola sem professor faz semanas...",
  "Lixo acumulado no bairro...",
  "Obra pública abandonada...",
  "Descaso com a comunidade...",
];

interface MediaItem {
  uri: string;
  type: "image" | "video";
  base64?: string;
  mimeType?: string;
  fileName?: string;
}

export default function CreatePostScreen() {
  const colors = useColors();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("other");
  const [locationCity, setLocationCity] = useState("");
  const [locationState, setLocationState] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMediaMutation = trpc.citizenFeed.uploadMedia.useMutation();
  const createPostMutation = trpc.citizenFeed.create.useMutation({
    onSuccess: () => {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✅ Post publicado!", "Sua denúncia foi compartilhada com a comunidade.", [
        { text: "Ver feed", onPress: () => router.replace("/feed" as never) },
      ]);
    },
    onError: (err) => {
      Alert.alert("Erro", err.message ?? "Não foi possível publicar o post.");
    },
  });

  const pickMedia = async (source: "library" | "camera") => {
    if (media.length >= 5) {
      Alert.alert("Limite atingido", "Você pode adicionar no máximo 5 fotos/vídeos por post.");
      return;
    }

    let result: ImagePicker.ImagePickerResult;

    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "Permita o acesso à câmera nas configurações.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        base64: true,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        selectionLimit: 5 - media.length,
        quality: 0.8,
        base64: true,
      });
    }

    if (!result.canceled && result.assets.length > 0) {
      const newItems: MediaItem[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === "video" ? "video" : "image",
        base64: asset.base64 ?? undefined,
        mimeType: asset.mimeType ?? (asset.type === "video" ? "video/mp4" : "image/jpeg"),
        fileName: asset.fileName ?? `media_${Date.now()}.${asset.type === "video" ? "mp4" : "jpg"}`,
      }));
      setMedia((prev) => [...prev, ...newItems].slice(0, 5));
    }
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!content.trim()) {
      Alert.alert("Campo obrigatório", "Descreva o que está acontecendo antes de publicar.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];
      const uploadedTypes: Array<"image" | "video"> = [];

      for (let i = 0; i < media.length; i++) {
        const item = media[i];
        setUploadProgress(Math.round(((i + 0.5) / (media.length + 1)) * 100));

        let base64 = item.base64;
        if (!base64 && Platform.OS !== "web") {
          base64 = await FileSystem.readAsStringAsync(item.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

        if (base64) {
          const result = await uploadMediaMutation.mutateAsync({
            base64,
            mimeType: item.mimeType ?? "image/jpeg",
            fileName: item.fileName ?? `media_${i}.jpg`,
          });
          uploadedUrls.push(result.url);
          uploadedTypes.push(item.type);
        }
      }

      setUploadProgress(90);

      await createPostMutation.mutateAsync({
        content: content.trim(),
        mediaUrls: uploadedUrls,
        mediaTypes: uploadedTypes,
        category,
        locationCity: locationCity.trim() || undefined,
        locationState: locationState.trim().toUpperCase().slice(0, 2) || undefined,
      });
    } catch (err: any) {
      Alert.alert("Erro ao publicar", err.message ?? "Tente novamente.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const selectedCat = CATEGORIES.find((c) => c.id === category);

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1E3A5F" }]}>
        <BackButton onPress={() => router.back()} label="" variant="dark" />
        <Text style={styles.headerTitle}>Nova Denúncia</Text>
        <Pressable
          onPress={handlePublish}
          disabled={isUploading || !content.trim()}
          style={({ pressed }) => [
            styles.publishBtn,
            { opacity: pressed || isUploading || !content.trim() ? 0.6 : 1 },
          ]}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.publishBtnText}>Publicar</Text>
          )}
        </Pressable>
      </View>

      {isUploading && (
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${uploadProgress}%` as any }]} />
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Prompt sugestão */}
        <View style={[styles.promptBox, { backgroundColor: "#1E3A5F10", borderColor: "#1E3A5F30" }]}>
          <Text style={[styles.promptTitle, { color: "#1E3A5F" }]}>
            📢 O que está errado na sua rua, bairro ou cidade?
          </Text>
          <Text style={[styles.promptSub, { color: colors.muted }]}>
            Exemplos: {PROMPTS[Math.floor(Math.random() * PROMPTS.length)]}
          </Text>
        </View>

        {/* Texto do post */}
        <TextInput
          style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
          placeholder="Descreva o problema em detalhes. Quanto mais informações, mais impacto sua denúncia terá..."
          placeholderTextColor={colors.muted}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
          maxLength={2000}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, { color: colors.muted }]}>{content.length}/2000</Text>

        {/* Categoria */}
        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setCategory(cat.id)}
              style={({ pressed }) => [
                styles.catChip,
                category === cat.id && { backgroundColor: "#1E3A5F", borderColor: "#1E3A5F" },
                { borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={[
                styles.catLabel,
                { color: category === cat.id ? "#FFFFFF" : colors.foreground },
              ]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Localização */}
        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Localização (opcional)</Text>
        <View style={styles.locationRow}>
          <TextInput
            style={[styles.locationInput, { flex: 2, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholder="Cidade"
            placeholderTextColor={colors.muted}
            value={locationCity}
            onChangeText={setLocationCity}
          />
          <TextInput
            style={[styles.locationInput, { flex: 1, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholder="UF"
            placeholderTextColor={colors.muted}
            value={locationState}
            onChangeText={(t) => setLocationState(t.toUpperCase().slice(0, 2))}
            maxLength={2}
            autoCapitalize="characters"
          />
        </View>

        {/* Mídia */}
        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
          Fotos e Vídeos ({media.length}/5)
        </Text>
        <View style={styles.mediaRow}>
          {media.map((item, idx) => (
            <View key={idx} style={styles.mediaThumbnail}>
              <Image source={{ uri: item.uri }} style={styles.mediaThumbnailImg} resizeMode="cover" />
              {item.type === "video" && (
                <View style={styles.videoOverlay}>
                  <Text style={styles.videoIcon}>▶</Text>
                </View>
              )}
              <Pressable
                onPress={() => removeMedia(idx)}
                style={styles.removeBtn}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </Pressable>
            </View>
          ))}
          {media.length < 5 && (
            <View style={styles.addMediaBtns}>
              <Pressable
                onPress={() => pickMedia("library")}
                style={({ pressed }) => [styles.addMediaBtn, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}
              >
                <Text style={styles.addMediaIcon}>🖼️</Text>
                <Text style={[styles.addMediaLabel, { color: colors.muted }]}>Galeria</Text>
              </Pressable>
              {Platform.OS !== "web" && (
                <Pressable
                  onPress={() => pickMedia("camera")}
                  style={({ pressed }) => [styles.addMediaBtn, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}
                >
                  <Text style={styles.addMediaIcon}>📷</Text>
                  <Text style={[styles.addMediaLabel, { color: colors.muted }]}>Câmera</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Aviso de impacto */}
        <View style={[styles.impactBox, { backgroundColor: "#2D7D4610", borderColor: "#2D7D4630" }]}>
          <Text style={styles.impactTitle}>💪 Sua voz importa!</Text>
          <Text style={[styles.impactBody, { color: colors.muted }]}>
            Posts com fotos e vídeos têm 3x mais engajamento. Registre evidências visuais para fortalecer sua denúncia e mobilizar a comunidade.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 22, color: "#FFFFFF" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  publishBtn: { backgroundColor: "#E8A020", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 80, alignItems: "center" },
  publishBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  progressBar: { height: 3 },
  progressFill: { height: 3, backgroundColor: "#E8A020" },
  scrollContent: { padding: 16, gap: 12 },
  promptBox: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  promptTitle: { fontSize: 14, fontWeight: "700", lineHeight: 20 },
  promptSub: { fontSize: 12, lineHeight: 18, fontStyle: "italic" },
  textInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, lineHeight: 24, minHeight: 140 },
  charCount: { fontSize: 11, textAlign: "right", marginTop: -8 },
  sectionLabel: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  catScroll: { marginHorizontal: -4 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginHorizontal: 4 },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 13, fontWeight: "600" },
  locationRow: { flexDirection: "row", gap: 8 },
  locationInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  mediaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mediaThumbnail: { width: 90, height: 90, borderRadius: 10, overflow: "hidden", position: "relative" },
  mediaThumbnailImg: { width: "100%", height: "100%" },
  videoOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.3)" },
  videoIcon: { fontSize: 22, color: "#FFFFFF" },
  removeBtn: { position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  removeBtnText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  addMediaBtns: { flexDirection: "row", gap: 8 },
  addMediaBtn: { width: 90, height: 90, borderRadius: 10, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4 },
  addMediaIcon: { fontSize: 24 },
  addMediaLabel: { fontSize: 11, fontWeight: "600" },
  impactBox: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6, marginTop: 4 },
  impactTitle: { fontSize: 14, fontWeight: "700", color: "#2D7D46" },
  impactBody: { fontSize: 12, lineHeight: 18 },
});
