import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

/**
 * Configures the notification handler and registers the device's Expo push token
 * with the server whenever the user is authenticated.
 *
 * Call this hook once from the root layout.
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const registerMutation = trpc.pushTokens.register.useMutation();
  const registeredRef = useRef<string | null>(null);

  useEffect(() => {
    // Handle notification tap: navigate to the URL in the notification data
    function handleNotificationResponse(response: Notifications.NotificationResponse) {
      const data = response.notification.request.content.data;
      if (data?.url && typeof data.url === "string") {
        router.push(data.url as any);
      } else if (data?.postId) {
        router.push(`/feed/${data.postId}` as any);
      }
    }

    // Handle initial notification (app opened from notification)
    Notifications.getLastNotificationResponseAsync().then((lastResponse) => {
      if (lastResponse) {
        handleNotificationResponse(lastResponse);
      }
    }).catch(() => {});

    // Listen for notification taps while app is open
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Set global notification handler (show alert when app is in foreground)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Create Android notification channel
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "Padrão",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1E3A5F",
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    async function registerPushToken() {
      // Only works on physical devices
      if (!Device.isDevice) return;
      // Web doesn't support push tokens
      if (Platform.OS === "web") return;

      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.log("[Push] Permission not granted");
          return;
        }

        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;

        let token: string;
        if (projectId) {
          const result = await Notifications.getExpoPushTokenAsync({ projectId });
          token = result.data;
        } else {
          // Fallback for development without EAS project ID
          const result = await Notifications.getDevicePushTokenAsync();
          token = result.data as string;
        }

        if (token && token !== registeredRef.current) {
          registeredRef.current = token;
          await registerMutation.mutateAsync({ token, platform: "expo" });
          console.log("[Push] Token registered:", token.substring(0, 30) + "...");
        }
      } catch (error) {
        console.warn("[Push] Failed to register push token:", error);
      }
    }

    registerPushToken();
  }, [user?.id]);
}
