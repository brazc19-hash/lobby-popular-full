import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const OFFLINE_LOBBIES_KEY = "@populus:offline_lobbies";
const NETWORK_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface OfflineLobby {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  supportCount: number;
  locationCity?: string | null;
  locationState?: string | null;
  savedAt: number;
}

export function useOfflineLobbies() {
  const [savedLobbies, setSavedLobbies] = useState<OfflineLobby[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  // Load saved lobbies from AsyncStorage
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(OFFLINE_LOBBIES_KEY);
        if (raw) {
          const parsed: OfflineLobby[] = JSON.parse(raw);
          setSavedLobbies(parsed);
        }
      } catch {
        // Ignore parse errors
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  const saveLobby = useCallback(async (lobby: Omit<OfflineLobby, "savedAt">) => {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_LOBBIES_KEY);
      const existing: OfflineLobby[] = raw ? JSON.parse(raw) : [];
      // Remove old version if exists
      const filtered = existing.filter((l) => l.id !== lobby.id);
      const updated = [{ ...lobby, savedAt: Date.now() }, ...filtered];
      await AsyncStorage.setItem(OFFLINE_LOBBIES_KEY, JSON.stringify(updated));
      setSavedLobbies(updated);
      return true;
    } catch {
      return false;
    }
  }, []);

  const removeLobby = useCallback(async (lobbyId: number) => {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_LOBBIES_KEY);
      const existing: OfflineLobby[] = raw ? JSON.parse(raw) : [];
      const updated = existing.filter((l) => l.id !== lobbyId);
      await AsyncStorage.setItem(OFFLINE_LOBBIES_KEY, JSON.stringify(updated));
      setSavedLobbies(updated);
      return true;
    } catch {
      return false;
    }
  }, []);

  const isSaved = useCallback(
    (lobbyId: number) => savedLobbies.some((l) => l.id === lobbyId),
    [savedLobbies]
  );

  const clearAll = useCallback(async () => {
    await AsyncStorage.removeItem(OFFLINE_LOBBIES_KEY);
    setSavedLobbies([]);
  }, []);

  return {
    savedLobbies,
    isOnline,
    isLoaded,
    saveLobby,
    removeLobby,
    isSaved,
    clearAll,
    NETWORK_CACHE_TTL,
  };
}
