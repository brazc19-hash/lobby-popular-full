import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  "house.fill": "home",
  "map.fill": "map",
  "plus.circle.fill": "add-circle",
  "person.3.fill": "groups",
  "person.fill": "person",
  // Actions
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "arrow.left": "arrow-back",
  "xmark": "close",
  "square.and.arrow.down": "download",
  "qrcode": "qr-code-scanner",
  "wifi.slash": "wifi-off",
  "bookmark.fill": "bookmark",
  "bookmark": "bookmark-border",
  "magnifyingglass": "search",
  "bell.fill": "notifications",
  "heart.fill": "favorite",
  "heart": "favorite-border",
  "hand.thumbsup.fill": "thumb-up",
  "hand.thumbsup": "thumb-up-off-alt",
  "share": "share",
  "ellipsis": "more-horiz",
  "plus": "add",
  "trash": "delete",
  "pencil": "edit",
  "checkmark": "check",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  // Content
  "doc.text.fill": "article",
  "newspaper.fill": "newspaper",
  "building.columns.fill": "account-balance",
  "location.fill": "location-on",
  "location": "location-off",
  "mappin": "place",
  "flag.fill": "flag",
  "flag": "outlined-flag",
  "shield.fill": "shield",
  "person.badge.plus": "person-add",
  "person.crop.circle": "account-circle",
  "bubble.left.fill": "chat-bubble",
  "bubble.left": "chat-bubble-outline",
  "star.fill": "star",
  "star": "star-border",
  "info.circle": "info",
  "exclamationmark.triangle.fill": "warning",
  "gavel": "gavel",
  "scale.3d": "balance",
  "megaphone.fill": "campaign",
  "chart.bar.fill": "bar-chart",
  "arrow.up.circle.fill": "arrow-circle-up",
  "arrow.down.circle.fill": "arrow-circle-down",
  "eye.fill": "visibility",
  "lock.fill": "lock",
  "globe": "language",
  "phone.fill": "phone",
  "doc.on.doc.fill": "content-copy",
  "calendar": "calendar-today",
  "clock": "access-time",
  "clock.fill": "access-time",
  "filter": "filter-list",
  "arrow.clockwise": "refresh",
  "line.3.horizontal.decrease": "filter-list",
  "gear": "settings",
  "person.2.fill": "people",
  "envelope.fill": "mail",
  "link": "link",
  "photo": "photo",
  "photo.fill": "photo",
  "camera.fill": "photo-camera",
  "camera": "camera-alt",
  "video": "videocam",
  "doc.fill": "description",
  "text.bubble.fill": "forum",
  "at": "alternate-email",
  // Settings, Help, Tips, About
  "gearshape.fill": "settings",
  "questionmark.circle.fill": "help",
  "moon.fill": "dark-mode",
  "chevron.down": "expand-more",
  "sparkles": "auto-awesome",
  "lightbulb.fill": "lightbulb",
} as unknown as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
