/**
 * Expo Push Notifications helper for end-user notifications.
 * Uses the Expo Push API: https://api.expo.dev/v2/push/send
 */

export interface PushMessage {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string; // Android notification channel
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Send push notifications to one or more Expo push tokens.
 * Batches up to 100 messages per request (Expo limit).
 * Returns true if all messages were accepted, false otherwise.
 */
export async function sendPushNotifications(messages: PushMessage[]): Promise<boolean> {
  if (!messages.length) return true;

  // Batch into chunks of 100
  const chunks: PushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  let allOk = true;
  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.warn(`[Push] Failed to send notifications (${response.status}): ${text}`);
        allOk = false;
        continue;
      }

      const result = await response.json() as { data: Array<{ status: string; message?: string }> };
      for (const item of result.data ?? []) {
        if (item.status !== "ok") {
          console.warn(`[Push] Notification error: ${item.message ?? item.status}`);
          allOk = false;
        }
      }
    } catch (error) {
      console.warn("[Push] Error sending push notifications:", error);
      allOk = false;
    }
  }

  return allOk;
}

/**
 * Send a single push notification to a user's push token.
 */
export async function sendPushToUser(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  return sendPushNotifications([{
    to: token,
    title,
    body,
    data,
    sound: "default",
    channelId: "default",
  }]);
}
