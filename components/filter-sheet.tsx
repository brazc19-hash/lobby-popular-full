import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { PETITION_CATEGORIES } from "@/drizzle/schema";

export interface LobbyFilters {
  category?: "national" | "local";
  petitionCategory?: string;
  state?: string;
  city?: string;
  search?: string;
}

interface FilterSheetProps {
  visible: boolean;
  filters: LobbyFilters;
  onApply: (filters: LobbyFilters) => void;
  onClose: () => void;
}

const BRAZIL_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

const CATEGORY_ICONS: Record<string, string> = {
  infrastructure: "🏗️",
  education: "📚",
  health: "🏥",
  security: "🛡️",
  environment: "🌿",
  human_rights: "✊",
  economy: "💰",
  transparency: "👁️",
  culture: "🎭",
};

export function FilterSheet({ visible, filters, onApply, onClose }: FilterSheetProps) {
  const colors = useColors();
  const [local, setLocal] = useState<LobbyFilters>(filters);

  const handleApply = () => {
    // Remove empty strings
    const cleaned: LobbyFilters = {};
    if (local.category) cleaned.category = local.category;
    if (local.petitionCategory) cleaned.petitionCategory = local.petitionCategory;
    if (local.state) cleaned.state = local.state;
    if (local.city?.trim()) cleaned.city = local.city.trim();
    if (local.search?.trim()) cleaned.search = local.search.trim();
    onApply(cleaned);
    onClose();
  };

  const handleReset = () => {
    setLocal({});
    onApply({});
    onClose();
  };

  const toggle = <T extends string>(current: T | undefined, value: T): T | undefined =>
    current === value ? undefined : value;

  const activeCount = Object.values(local).filter(Boolean).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>Filtros</Text>
            {activeCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{activeCount}</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Busca</Text>
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Buscar lobbys..."
              placeholderTextColor={colors.muted}
              value={local.search ?? ""}
              onChangeText={(t) => setLocal(prev => ({ ...prev, search: t }))}
              returnKeyType="done"
            />
          </View>

          {/* Tipo de Lobby */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tipo de Lobby</Text>
          <View style={styles.chipRow}>
            {[
              { value: undefined, label: "Todos" },
              { value: "national" as const, label: "🏛️ Nacional" },
              { value: "local" as const, label: "📍 Local" },
            ].map((opt) => {
              const active = local.category === opt.value;
              return (
                <Pressable
                  key={String(opt.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setLocal(prev => ({ ...prev, category: opt.value }))}
                >
                  <Text style={[styles.chipText, { color: active ? "#fff" : colors.foreground }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Categoria de Petição */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Categoria</Text>
          <View style={styles.chipGrid}>
            {PETITION_CATEGORIES.map((cat) => {
              const active = local.petitionCategory === cat.value;
              return (
                <Pressable
                  key={cat.value}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() =>
                    setLocal(prev => ({
                      ...prev,
                      petitionCategory: toggle(prev.petitionCategory, cat.value),
                    }))
                  }
                >
                  <Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat.value]}</Text>
                  <Text
                    style={[styles.categoryText, { color: active ? "#fff" : colors.foreground }]}
                    numberOfLines={2}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Estado */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Estado</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stateScroll}>
            <View style={styles.chipRow}>
              {BRAZIL_STATES.map((s) => {
                const active = local.state === s.value;
                return (
                  <Pressable
                    key={s.value}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() =>
                      setLocal(prev => ({ ...prev, state: toggle(prev.state, s.value) }))
                    }
                  >
                    <Text style={[styles.chipText, { color: active ? "#fff" : colors.foreground }]}>
                      {s.value}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Cidade */}
          {local.state && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Cidade</Text>
              <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="mappin" size={16} color={colors.muted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.foreground }]}
                  placeholder="Nome da cidade..."
                  placeholderTextColor={colors.muted}
                  value={local.city ?? ""}
                  onChangeText={(t) => setLocal(prev => ({ ...prev, city: t }))}
                  returnKeyType="done"
                />
              </View>
            </>
          )}

          <View style={styles.spacer} />
        </ScrollView>

        {/* Actions */}
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.resetBtn, { borderColor: colors.border }]}
            onPress={handleReset}
          >
            <Text style={[styles.resetText, { color: colors.muted }]}>Limpar</Text>
          </Pressable>
          <Pressable
            style={[styles.applyBtn, { backgroundColor: colors.primary }]}
            onPress={handleApply}
          >
            <Text style={styles.applyText}>Aplicar Filtros</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "85%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    width: "30%",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 14,
  },
  stateScroll: {
    marginBottom: 4,
  },
  spacer: {
    height: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  resetText: {
    fontSize: 15,
    fontWeight: "600",
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  applyText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
