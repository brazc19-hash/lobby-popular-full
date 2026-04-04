import { useRef } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  lobbyId: number;
  lobbyTitle: string;
  lobbyUrl?: string;
}

export function QRCodeModal({ visible, onClose, lobbyId, lobbyTitle, lobbyUrl }: QRCodeModalProps) {
  const colors = useColors();
  const svgRef = useRef<{ toDataURL: (cb: (data: string) => void) => void } | null>(null);

  // Deep link URL for the lobby
  const qrValue = lobbyUrl ?? `https://populus.app/lobby/${lobbyId}`;

  const handleShare = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Share.share({
        message: `📢 Apoie este lobby no Populus!\n\n"${lobbyTitle}"\n\n${qrValue}`,
        url: qrValue,
        title: lobbyTitle,
      });
    } catch {
      // User cancelled
    }
  };

  const handleSaveImage = () => {
    if (!svgRef.current) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    svgRef.current.toDataURL((data) => {
      // On mobile, share the base64 image
      Share.share({
        message: `QR Code do lobby: ${lobbyTitle}`,
        url: `data:image/png;base64,${data}`,
      }).catch(() => {
        Alert.alert("Compartilhar QR Code", "Use o botão de compartilhar para enviar o link do lobby.");
      });
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>QR Code do Lobby</Text>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.6 : 1 }]}
              onPress={onClose}
            >
              <IconSymbol name="xmark" size={20} color={colors.muted} />
            </Pressable>
          </View>

          {/* Lobby title */}
          <Text style={[styles.lobbyTitle, { color: colors.muted }]} numberOfLines={2}>
            {lobbyTitle}
          </Text>

          {/* QR Code */}
          <View style={[styles.qrContainer, { backgroundColor: "#FFFFFF", borderColor: colors.border }]}>
            <QRCode
              value={qrValue}
              size={200}
              color="#1E3A5F"
              backgroundColor="#FFFFFF"
              logo={undefined}
              getRef={(ref) => {
                if (ref) svgRef.current = ref as unknown as { toDataURL: (cb: (data: string) => void) => void };
              }}
            />
          </View>

          {/* URL hint */}
          <Text style={[styles.urlHint, { color: colors.muted }]} numberOfLines={1}>
            {qrValue}
          </Text>

          {/* Instructions */}
          <View style={[styles.instructionBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <Text style={styles.instructionIcon}>📱</Text>
            <Text style={[styles.instructionText, { color: colors.foreground }]}>
              Aponte a câmera do celular para este QR Code para acessar o lobby diretamente no Populus.
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, flex: 1 },
              ]}
              onPress={handleShare}
            >
              <IconSymbol name="paperplane.fill" size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Compartilhar Link</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleSaveImage}
            >
              <IconSymbol name="square.and.arrow.down" size={16} color={colors.foreground} />
              <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Salvar QR</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  lobbyTitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    width: "100%",
  },
  qrContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  urlHint: {
    fontSize: 11,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  instructionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: "100%",
  },
  instructionIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
