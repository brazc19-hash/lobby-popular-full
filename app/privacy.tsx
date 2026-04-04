import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, Pressable, TextInput,
  Alert, ActivityIndicator, StyleSheet, Switch,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { BackButton } from "@/components/ui/back-button";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function PrivacyScreen() {
  const goBack = useSmartBack("/(tabs)/profile");
  const colors = useColors();
  const utils = trpc.useUtils();

  const { data: settings, isLoading } = trpc.privacy.getSettings.useQuery();
  const updateMutation = trpc.privacy.updateSettings.useMutation({
    onSuccess: () => utils.privacy.getSettings.invalidate(),
    onError: (e) => Alert.alert("Erro", e.message),
  });
  const exportMutation = trpc.privacy.exportData.useQuery(undefined, { enabled: false });

  const [profileVisibility, setProfileVisibility] = useState<"public" | "followers" | "private">("public");
  const [showLocation, setShowLocation] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [anonymousAlias, setAnonymousAlias] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setProfileVisibility((settings.profileVisibility as "public" | "followers" | "private") ?? "public");
      setShowLocation(settings.showLocation ?? true);
      setShowActivity(settings.showActivity ?? true);
      setShowPoints(settings.showPoints ?? true);
      setAllowAnonymous(settings.allowAnonymous ?? false);
      setAnonymousAlias(settings.anonymousAlias ?? "");
      setConsentGiven(!!settings.dataConsentAt);
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate({
      profileVisibility,
      showLocation,
      showActivity,
      showPoints,
      allowAnonymous,
      anonymousAlias: anonymousAlias || undefined,
      dataConsentAt: consentGiven ? true : undefined,
    });
    setHasChanges(false);
    Alert.alert("✅ Salvo", "Suas configurações de privacidade foram atualizadas.");
  };

  const handleExport = async () => {
    Alert.alert(
      "Exportar Meus Dados",
      "Conforme a LGPD (Art. 18, inciso V), você tem direito a receber uma cópia de todos os seus dados pessoais armazenados no Populus. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Exportar",
          onPress: async () => {
            const result = await exportMutation.refetch();
            if (result.data) {
              Alert.alert(
                "📦 Dados Exportados",
                `Seus dados foram preparados.\n\nExportado em: ${new Date(result.data.exportedAt).toLocaleString("pt-BR")}\n\n${result.data.notice}`,
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "⚠️ Excluir Conta",
      "Esta ação é irreversível. Todos os seus dados, lobbys criados, pontos e conquistas serão permanentemente removidos conforme a LGPD (Art. 18, inciso VI).\n\nPara confirmar, entre em contato com suporte@populus.app.",
      [{ text: "Entendido", style: "cancel" }]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: "#1E3A5F" }]}>
        <BackButton onPress={goBack} label="Voltar" variant="dark" />
        <Text style={s.headerTitle}>🔒 Privacidade e Dados</Text>
        <Text style={s.headerSub}>Controle suas informações conforme a LGPD</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* LGPD Notice */}
        <View style={[s.lgpdBox, { backgroundColor: "#1E3A5F15", borderColor: "#1E3A5F40" }]}>
          <Text style={[s.lgpdTitle, { color: "#1E3A5F" }]}>⚖️ Lei Geral de Proteção de Dados (LGPD)</Text>
          <Text style={[s.lgpdText, { color: colors.muted }]}>
            O Populus coleta apenas os dados necessários para o funcionamento da plataforma. Você tem o
            direito de acessar, corrigir, exportar e excluir seus dados a qualquer momento.
          </Text>
        </View>

        {/* Visibilidade do Perfil */}
        <View style={[s.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>👁️ Visibilidade do Perfil</Text>
          <Text style={[s.sectionSub, { color: colors.muted }]}>Quem pode ver seu perfil e atividades</Text>
          {(["public", "followers", "private"] as const).map((opt) => (
            <Pressable
              key={opt}
              onPress={() => { setProfileVisibility(opt); setHasChanges(true); }}
              style={[s.radioRow, { borderColor: colors.border }]}
            >
              <View style={[s.radio, { borderColor: profileVisibility === opt ? "#1E3A5F" : colors.border }]}>
                {profileVisibility === opt && <View style={[s.radioDot, { backgroundColor: "#1E3A5F" }]} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.radioLabel, { color: colors.foreground }]}>
                  {opt === "public" ? "🌍 Público" : opt === "followers" ? "👥 Apenas Seguidores" : "🔒 Privado"}
                </Text>
                <Text style={[s.radioSub, { color: colors.muted }]}>
                  {opt === "public"
                    ? "Qualquer pessoa pode ver seu perfil"
                    : opt === "followers"
                    ? "Apenas seus seguidores podem ver"
                    : "Ninguém pode ver seu perfil"}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Controles de Dados */}
        <View style={[s.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>🎛️ O que é visível</Text>
          {[
            { key: "location", label: "📍 Localização", sub: "Exibir cidade/estado no perfil", value: showLocation, set: setShowLocation },
            { key: "activity", label: "📊 Atividade", sub: "Exibir lobbys apoiados e comunidades", value: showActivity, set: setShowActivity },
            { key: "points", label: "🏆 Pontos e Nível", sub: "Exibir pontuação e conquistas", value: showPoints, set: setShowPoints },
          ].map((item) => (
            <View key={item.key} style={[s.toggleRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.toggleLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[s.toggleSub, { color: colors.muted }]}>{item.sub}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={(v) => { item.set(v); setHasChanges(true); }}
                trackColor={{ false: colors.border, true: "#1E3A5F" }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Anonimato Parcial */}
        <View style={[s.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>🎭 Anonimato Parcial</Text>
          <Text style={[s.sectionSub, { color: colors.muted }]}>
            Use um apelido em vez do seu nome real nas atividades públicas. Seus dados continuam
            armazenados de forma segura, mas sua identidade não é exibida.
          </Text>
          <View style={[s.toggleRow, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.toggleLabel, { color: colors.foreground }]}>Ativar anonimato</Text>
            </View>
            <Switch
              value={allowAnonymous}
              onValueChange={(v) => { setAllowAnonymous(v); setHasChanges(true); }}
              trackColor={{ false: colors.border, true: "#1E3A5F" }}
              thumbColor="#fff"
            />
          </View>
          {allowAnonymous && (
            <View style={{ marginTop: 12 }}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>Apelido público</Text>
              <TextInput
                style={[s.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                placeholder="Ex: CidadãoSP, AtivistaRJ..."
                placeholderTextColor={colors.muted}
                value={anonymousAlias}
                onChangeText={(v) => { setAnonymousAlias(v); setHasChanges(true); }}
                maxLength={50}
                returnKeyType="done"
              />
            </View>
          )}
        </View>

        {/* Consentimento */}
        <View style={[s.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>📋 Consentimento de Dados</Text>
          <Pressable
            onPress={() => { setConsentGiven(!consentGiven); setHasChanges(true); }}
            style={s.consentRow}
          >
            <View style={[s.checkbox, {
              borderColor: consentGiven ? "#1E3A5F" : colors.border,
              backgroundColor: consentGiven ? "#1E3A5F" : "transparent",
            }]}>
              {consentGiven && <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>✓</Text>}
            </View>
            <Text style={[s.consentText, { color: colors.muted }]}>
              Concordo com a coleta e uso dos meus dados para fins de participação cívica na plataforma
              Populus, conforme a Política de Privacidade e a LGPD.
            </Text>
          </Pressable>
          {settings?.dataConsentAt && (
            <Text style={[s.consentDate, { color: colors.muted }]}>
              Consentimento registrado em {new Date(settings.dataConsentAt).toLocaleDateString("pt-BR")}
            </Text>
          )}
        </View>

        {/* Save button */}
        {hasChanges && (
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [s.saveBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            {updateMutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.saveBtnText}>💾 Salvar Configurações</Text>
            }
          </Pressable>
        )}

        {/* LGPD Rights */}
        <View style={[s.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>⚖️ Seus Direitos (LGPD Art. 18)</Text>
          {[
            { icon: "📦", title: "Exportar meus dados", sub: "Receba uma cópia de todos os seus dados", action: handleExport },
            { icon: "🗑️", title: "Excluir minha conta", sub: "Remova permanentemente todos os seus dados", action: handleDeleteAccount },
          ].map((item) => (
            <Pressable
              key={item.title}
              onPress={item.action}
              style={({ pressed }) => [s.rightRow, { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={{ fontSize: 24 }}>{item.icon}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[s.rightTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[s.rightSub, { color: colors.muted }]}>{item.sub}</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 18 }}>›</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { padding: 20, paddingTop: 12, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 8 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  lgpdBox: { borderRadius: 12, padding: 14, borderWidth: 1 },
  lgpdTitle: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  lgpdText: { fontSize: 13, lineHeight: 18 },
  section: { borderRadius: 12, padding: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  sectionSub: { fontSize: 13, lineHeight: 17, marginBottom: 12 },
  radioRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 0.5, gap: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 2 },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  radioLabel: { fontSize: 14, fontWeight: "600" },
  radioSub: { fontSize: 12, marginTop: 2 },
  toggleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5 },
  toggleLabel: { fontSize: 14, fontWeight: "600" },
  toggleSub: { fontSize: 12, marginTop: 2 },
  inputLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14 },
  consentRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 2 },
  consentText: { flex: 1, fontSize: 13, lineHeight: 18 },
  consentDate: { fontSize: 11, marginTop: 8, fontStyle: "italic" },
  saveBtn: { backgroundColor: "#1E3A5F", borderRadius: 12, padding: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  rightRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 0.5 },
  rightTitle: { fontSize: 14, fontWeight: "600" },
  rightSub: { fontSize: 12, marginTop: 2 },
});
