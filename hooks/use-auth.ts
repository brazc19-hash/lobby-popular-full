import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import * as OAuth from "@/constants/oauth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { trpc } from "@/lib/trpc";

type UseAuthOptions = {
  autoFetch?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { data: userProfile } = trpc.users.profile.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (Platform.OS === "web") {
        const apiUser = await Api.getMe();
        if (apiUser) {
          const userInfo: Auth.User = {
            id: apiUser.id,
            openId: apiUser.openId,
            name: apiUser.name,
            email: apiUser.email,
            loginMethod: apiUser.loginMethod,
            lastSignedIn: new Date(apiUser.lastSignedIn),
          };
          setUser(userInfo);
          await Auth.setUserInfo(userInfo);
        } else {
          setUser(null);
          await Auth.clearUserInfo();
        }
        return;
      }

      const sessionToken = await Auth.getSessionToken();
      if (!sessionToken) {
        setUser(null);
        return;
      }

      const cachedUser = await Auth.getUserInfo();
      if (cachedUser) {
        setUser(cachedUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch user");
      setError(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Api.logout();
    } catch (err) {
      console.error("[Auth] Logout API call failed:", err);
    } finally {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      setUser(null);
      setError(null);
    }
  }, []);

  const startOAuthLogin = useCallback(async () => {
    await OAuth.startOAuthLogin();
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  // Merge role from server profile into user
  const enrichedUser = useMemo(() => {
    if (!user) return null;
    return {
      ...user,
      role: (userProfile?.role ?? "user") as "user" | "moderator" | "admin",
    };
  }, [user, userProfile]);

  useEffect(() => {
    if (autoFetch) {
      if (Platform.OS === "web") {
        fetchUser();
      } else {
        Auth.getUserInfo().then((cachedUser) => {
          if (cachedUser) {
            setUser(cachedUser);
            setLoading(false);
          } else {
            fetchUser();
          }
        });
      }
    } else {
      setLoading(false);
    }
  }, [autoFetch, fetchUser]);

  return {
    user: enrichedUser,
    loading,
    error,
    isAuthenticated,
    refresh: fetchUser,
    logout,
    startOAuthLogin,
  };
}
