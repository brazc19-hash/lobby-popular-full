import React, { useEffect, useRef, useCallback } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, usePathname } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useTour } from "@/contexts/tour-context";

const { width: SCREEN_W } = Dimensions.get("window");
const DRAWER_W = Math.min(SCREEN_W * 0.8, 320);
const ANIM_DURATION = 300;

// ─── Types ────────────────────────────────────────────────────────────────────

interface DrawerItem {
  icon: string;
  label: string;
  route?: string;
  action?: () => void;
  destructive?: boolean;
}

interface DrawerSection {
  title: string;
  items: DrawerItem[];
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface DrawerContextValue {
  openDrawer: () => void;
  closeDrawer: () => void;
  isOpen: boolean;
}

export const DrawerContext = React.createContext<DrawerContextValue>({
  openDrawer: () => {},
  closeDrawer: () => {},
  isOpen: false,
});

export function useDrawer() {
  return React.useContext(DrawerContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, isOpen }}>
      {children}
      {isOpen && <DrawerMenu onClose={closeDrawer} />}
    </DrawerContext.Provider>
  );
}

// ─── Drawer Menu Component ────────────────────────────────────────────────────

function DrawerMenu({ onClose }: { onClose: () => void }) {
  const colors = useColors();
  const { user } = useAuth();
  const { startTour } = useTour();
  const pathname = usePathname();

  const slideX = useRef(new Animated.Value(-DRAWER_W)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Open animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideX, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Back button handler (Android)
  useEffect(() => {
    if (Platform.OS === "android") {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        handleClose();
        return true;
      });
      return () => sub.remove();
    }
  }, []);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideX, {
        toValue: -DRAWER_W,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [onClose]);

  const navigate = useCallback(
    (route: string) => {
      handleClose();
      setTimeout(() => router.push(route as never), 50);
    },
    [handleClose]
  );

  const sections: DrawerSection[] = [
    {
      title: "Navegação",
      items: [
        { icon: "🏠", label: "Início", route: "/(tabs)" },
        { icon: "📢", label: "Feed Cidadão", route: "/feed" },
        { icon: "🔍", label: "Explorar", route: "/(tabs)/explore" },
        { icon: "📋", label: "Minhas Campanhas", route: "/lobbies" },
        { icon: "👥", label: "Comunidades", route: "/(tabs)/communities" },
        { icon: "🏛️", label: "Congresso Nacional", route: "/(tabs)/congress" },
        { icon: "📺", label: "TV Câmara Ao Vivo", route: "/congress/live" },
      ],
    },
    {
      title: "Suporte",
      items: [
        {
          icon: "🎓",
          label: "Tutorial",
          action: () => {
            handleClose();
            setTimeout(() => startTour(), 350);
          },
        },
        { icon: "🎬", label: "Como Funciona", route: "/how-it-works" },
        { icon: "🤖", label: "Chat com IA", route: "/help-chat" },
        { icon: "❓", label: "Central de Ajuda", route: "/help" },
        { icon: "💡", label: "Dicas Rápidas", route: "/tips" },
      ],
    },
    {
      title: "Conta",
      items: [
        { icon: "👤", label: "Meu Perfil", route: "/(tabs)/profile" },
        { icon: "⚙️", label: "Configurações", route: "/settings" },
        { icon: "🔔", label: "Notificações", route: "/notifications" },
        ...(user?.role === "admin" || user?.role === "moderator"
          ? [{ icon: "🛡️", label: "Painel Admin", route: "/admin" }]
          : []),
        {
          icon: "🚪",
          label: "Sair",
          destructive: true,
          action: () => {
            handleClose();
            setTimeout(() => router.push("/logout-confirm" as never), 50);
          },
        },
      ],
    },
    {
      title: "Institucional",
      items: [
        { icon: "ℹ️", label: "Sobre o Populus", route: "/about" },
        { icon: "🔑", label: "Acesso por Convite", route: "/invite" },
        { icon: "🔒", label: "Privacidade (LGPD)", route: "/privacy" },
        { icon: "📧", label: "Contato", route: "/contact" },
      ],
    },
  ];

  const isActive = (route?: string) => {
    if (!route) return false;
    if (route === "/(tabs)" && (pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/index")) return true;
    return pathname.startsWith(route) && route !== "/(tabs)";
  };

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent>
      {/* Overlay */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents="auto"
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          { backgroundColor: colors.surface, transform: [{ translateX: slideX }] },
        ]}
      >
        {/* Header */}
        <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.userInfo}>
            <View style={[styles.avatarCircle, { backgroundColor: "#1E3A5F" }]}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : "P"}
              </Text>
            </View>
            <View style={styles.userTextBlock}>
              <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>
                {user?.name ?? "Visitante"}
              </Text>
              <Text style={[styles.userHandle, { color: colors.muted }]} numberOfLines={1}>
                {user?.email ? `@${user.email.split("@")[0]}` : "Faça login para continuar"}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.6 : 1 }]}
            accessibilityLabel="Fechar menu"
          >
            <Text style={[styles.closeBtnText, { color: colors.muted }]}>✕</Text>
          </Pressable>
        </View>

        {/* Items */}
        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.muted }]}>
                {section.title.toUpperCase()}
              </Text>
              {section.items.map((item) => {
                const active = isActive(item.route);
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => {
                      if (item.action) {
                        item.action();
                      } else if (item.route) {
                        navigate(item.route);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.menuItem,
                      active && styles.menuItemActive,
                      pressed && { opacity: 0.75 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    {/* Active indicator bar */}
                    {active && <View style={[styles.activeBar, { backgroundColor: "#2D7D46" }]} />}

                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text
                      style={[
                        styles.menuLabel,
                        { color: item.destructive ? "#C0392B" : active ? "#2D7D46" : colors.foreground },
                        active && styles.menuLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* Version footer */}
          <Text style={[styles.versionText, { color: colors.muted }]}>
            © Populus · v1.0.0
          </Text>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Hamburger Button ─────────────────────────────────────────────────────────

export function HamburgerButton({ color }: { color?: string }) {
  const { openDrawer } = useDrawer();
  const colors = useColors();
  const btnColor = color ?? colors.foreground;

  return (
    <Pressable
      onPress={openDrawer}
      style={({ pressed }) => [styles.hamburger, { opacity: pressed ? 0.6 : 1 }]}
      accessibilityLabel="Abrir menu"
      accessibilityRole="button"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View style={[styles.hamburgerLine, { backgroundColor: btnColor }]} />
      <View style={[styles.hamburgerLine, { backgroundColor: btnColor, width: 18 }]} />
      <View style={[styles.hamburgerLine, { backgroundColor: btnColor }]} />
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_W,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  userTextBlock: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  userHandle: {
    fontSize: 12,
    lineHeight: 17,
  },
  closeBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollArea: {
    flex: 1,
  },
  section: {
    paddingTop: 20,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 12,
    position: "relative",
    overflow: "hidden",
  },
  menuItemActive: {
    backgroundColor: "rgba(45,125,70,0.08)",
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
  },
  menuIcon: {
    fontSize: 20,
    width: 28,
    textAlign: "center",
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  menuLabelActive: {
    fontWeight: "700",
  },
  versionText: {
    textAlign: "center",
    fontSize: 11,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  // Hamburger button
  hamburger: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  hamburgerLine: {
    width: 22,
    height: 2,
    borderRadius: 1,
  },
});
