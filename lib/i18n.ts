import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import React from "react";

export type Language = "pt" | "en" | "es";

const STORAGE_KEY = "populus_language";

// ─── Translations ─────────────────────────────────────────────────────────────

const translations = {
  pt: {
    // App name & general
    appName: "Populus",
    tagline: "A voz do povo, organizada.",
    loading: "Carregando...",
    save: "Salvar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    back: "Voltar",
    close: "Fechar",
    yes: "Sim",
    no: "Não",
    error: "Erro",
    success: "Sucesso",
    search: "Buscar",
    share: "Compartilhar",
    report: "Denunciar",
    send: "Enviar",
    create: "Criar",
    edit: "Editar",
    delete: "Excluir",
    // Navigation tabs
    tabFeed: "Feed",
    tabExplore: "Explorar",
    tabCreate: "Criar",
    tabCommunity: "Comunidade",
    tabProfile: "Perfil",
    // Home
    homeTitle: "Populus",
    homeSubtitle: "Plataforma Populus",
    powerPeopleTitle: "Poder Popular",
    activeCitizens: "cidadãos ativos",
    electorateWeight: "do eleitorado",
    billsInfluenced: "projetos influenciados",
    victories: "vitórias populares",
    priorityAgendaTitle: "Pautas Prioritárias",
    nationalPlebiscitesTitle: "Plebiscitos Nacionais",
    // Lobbies
    lobbySupport: "Apoiar",
    lobbySupporting: "Apoiando",
    lobbyPressure: "Pressionar",
    lobbyShare: "Compartilhar",
    lobbyQrCode: "QR Code",
    lobbySave: "Salvar offline",
    lobbySaved: "Salvo",
    lobbySupports: "apoios",
    lobbyGoal: "meta",
    lobbyStatus_active: "Em mobilização",
    lobbyStatus_pressure: "Em pressão",
    lobbyStatus_processing: "Em tramitação",
    lobbyStatus_concluded: "Concluído",
    lobbyStatus_pending: "Em análise",
    lobbyStatus_rejected: "Rejeitado",
    // Categories
    cat_infrastructure: "Infraestrutura",
    cat_education: "Educação",
    cat_health: "Saúde",
    cat_security: "Segurança",
    cat_environment: "Meio Ambiente",
    cat_human_rights: "Direitos Humanos",
    cat_economy: "Economia",
    cat_transparency: "Transparência",
    cat_culture: "Cultura",
    // Profile
    profileTitle: "Meu Perfil",
    profileLogin: "Entrar no Populus",
    profileLoginSubtitle: "Participe da maior rede de causas populares do Brasil",
    profileLoginGovBr: "Entrar com Gov.br",
    profileLoginManus: "Entrar com Manus",
    profilePoints: "pontos",
    profileLevel: "Nível",
    profileLobbiesCreated: "Campanhas criadas",
    profileLobbiesSupported: "Campanhas apoiadas",
    profilePressuresSent: "Pressões enviadas",
    // Gamification levels
    level1: "Observador",
    level2: "Apoiador",
    level3: "Mobilizador",
    level4: "Líder Comunitário",
    level5: "Herói Popular",
    // Settings
    settingsTitle: "Configurações",
    settingsLanguage: "Idioma",
    settingsTheme: "Tema",
    settingsPrivacy: "Privacidade",
    settingsModeration: "Moderação",
    settingsPress: "Imprensa",
    settingsOffline: "Campanhas salvas",
    settingsLogout: "Sair",
    // Language names
    langPt: "Português",
    langEn: "English",
    langEs: "Español",
  },
  en: {
    appName: "Populus",
    tagline: "The people's voice, organized.",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    back: "Back",
    close: "Close",
    yes: "Yes",
    no: "No",
    error: "Error",
    success: "Success",
    search: "Search",
    share: "Share",
    report: "Report",
    send: "Send",
    create: "Create",
    edit: "Edit",
    delete: "Delete",
    tabFeed: "Feed",
    tabExplore: "Explore",
    tabCreate: "Create",
    tabCommunity: "Community",
    tabProfile: "Profile",
    homeTitle: "Populus",
    homeSubtitle: "Populus Platform",
    powerPeopleTitle: "People's Power",
    activeCitizens: "active citizens",
    electorateWeight: "of electorate",
    billsInfluenced: "bills influenced",
    victories: "popular victories",
    priorityAgendaTitle: "Priority Agendas",
    nationalPlebiscitesTitle: "National Plebiscites",
    lobbySupport: "Support",
    lobbySupporting: "Supporting",
    lobbyPressure: "Pressure",
    lobbyShare: "Share",
    lobbyQrCode: "QR Code",
    lobbySave: "Save offline",
    lobbySaved: "Saved",
    lobbySupports: "supports",
    lobbyGoal: "goal",
    lobbyStatus_active: "Mobilizing",
    lobbyStatus_pressure: "Under pressure",
    lobbyStatus_processing: "In processing",
    lobbyStatus_concluded: "Concluded",
    lobbyStatus_pending: "Under review",
    lobbyStatus_rejected: "Rejected",
    cat_infrastructure: "Infrastructure",
    cat_education: "Education",
    cat_health: "Health",
    cat_security: "Security",
    cat_environment: "Environment",
    cat_human_rights: "Human Rights",
    cat_economy: "Economy",
    cat_transparency: "Transparency",
    cat_culture: "Culture",
    profileTitle: "My Profile",
    profileLogin: "Sign in to Populus",
    profileLoginSubtitle: "Join Brazil's largest popular causes network",
    profileLoginGovBr: "Sign in with Gov.br",
    profileLoginManus: "Sign in with Manus",
    profilePoints: "points",
    profileLevel: "Level",
    profileLobbiesCreated: "Campaigns created",
    profileLobbiesSupported: "Campaigns supported",
    profilePressuresSent: "Pressures sent",
    level1: "Observer",
    level2: "Supporter",
    level3: "Mobilizer",
    level4: "Community Leader",
    level5: "People's Hero",
    settingsTitle: "Settings",
    settingsLanguage: "Language",
    settingsTheme: "Theme",
    settingsPrivacy: "Privacy",
    settingsModeration: "Moderation",
    settingsPress: "Press",
    settingsOffline: "Saved campaigns",
    settingsLogout: "Sign out",
    langPt: "Português",
    langEn: "English",
    langEs: "Español",
  },
  es: {
    appName: "Populus",
    tagline: "La voz del pueblo, organizada.",
    loading: "Cargando...",
    save: "Guardar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    back: "Volver",
    close: "Cerrar",
    yes: "Sí",
    no: "No",
    error: "Error",
    success: "Éxito",
    search: "Buscar",
    share: "Compartir",
    report: "Denunciar",
    send: "Enviar",
    create: "Crear",
    edit: "Editar",
    delete: "Eliminar",
    tabFeed: "Feed",
    tabExplore: "Explorar",
    tabCreate: "Crear",
    tabCommunity: "Comunidad",
    tabProfile: "Perfil",
    homeTitle: "Populus",
    homeSubtitle: "Plataforma Populus",
    powerPeopleTitle: "Poder Popular",
    activeCitizens: "ciudadanos activos",
    electorateWeight: "del electorado",
    billsInfluenced: "proyectos influenciados",
    victories: "victorias populares",
    priorityAgendaTitle: "Agendas Prioritarias",
    nationalPlebiscitesTitle: "Plebiscitos Nacionales",
    lobbySupport: "Apoyar",
    lobbySupporting: "Apoyando",
    lobbyPressure: "Presionar",
    lobbyShare: "Compartir",
    lobbyQrCode: "Código QR",
    lobbySave: "Guardar sin conexión",
    lobbySaved: "Guardado",
    lobbySupports: "apoyos",
    lobbyGoal: "meta",
    lobbyStatus_active: "En movilización",
    lobbyStatus_pressure: "Bajo presión",
    lobbyStatus_processing: "En tramitación",
    lobbyStatus_concluded: "Concluido",
    lobbyStatus_pending: "En revisión",
    lobbyStatus_rejected: "Rechazado",
    cat_infrastructure: "Infraestructura",
    cat_education: "Educación",
    cat_health: "Salud",
    cat_security: "Seguridad",
    cat_environment: "Medio Ambiente",
    cat_human_rights: "Derechos Humanos",
    cat_economy: "Economía",
    cat_transparency: "Transparencia",
    cat_culture: "Cultura",
    profileTitle: "Mi Perfil",
    profileLogin: "Entrar en Populus",
    profileLoginSubtitle: "Únete a la mayor red de causas populares de Brasil",
    profileLoginGovBr: "Entrar con Gov.br",
    profileLoginManus: "Entrar con Manus",
    profilePoints: "puntos",
    profileLevel: "Nivel",
    profileLobbiesCreated: "Campañas creadas",
    profileLobbiesSupported: "Campañas apoyadas",
    profilePressuresSent: "Presiones enviadas",
    level1: "Observador",
    level2: "Defensor",
    level3: "Movilizador",
    level4: "Líder Comunitario",
    level5: "Héroe Popular",
    settingsTitle: "Configuración",
    settingsLanguage: "Idioma",
    settingsTheme: "Tema",
    settingsPrivacy: "Privacidad",
    settingsModeration: "Moderación",
    settingsPress: "Prensa",
    settingsOffline: "Campañas guardadas",
    settingsLogout: "Cerrar sesión",
    langPt: "Português",
    langEn: "English",
    langEs: "Español",
  },
} as const;

export type TranslationKey = keyof typeof translations.pt;

// ─── Context ──────────────────────────────────────────────────────────────────

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
}

export const I18nContext = createContext<I18nContextValue>({
  language: "pt",
  setLanguage: async () => {},
  t: (key) => translations.pt[key] ?? key,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "pt" || stored === "en" || stored === "es") {
        setLanguageState(stored);
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return (translations[language] as Record<string, string>)[key] ?? (translations.pt as Record<string, string>)[key] ?? key;
    },
    [language]
  );

  return React.createElement(I18nContext.Provider, { value: { language, setLanguage, t } }, children);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useI18n() {
  return useContext(I18nContext);
}
