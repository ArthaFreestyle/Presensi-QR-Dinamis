import { useState, useEffect } from "react";

const STORAGE_KEY = "presensi_user_id";

export function useUserId() {
  const [userId, setUserIdState] = useState<string>("");
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    // Only access localStorage on the client side
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setUserIdState(stored);
      setIsConfigured(true);
    } else {
      setIsConfigured(false);
    }
  }, []);

  const setUserId = (newUserId: string) => {
    localStorage.setItem(STORAGE_KEY, newUserId);
    setUserIdState(newUserId);
    setIsConfigured(true);
  };

  const clearUserId = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserIdState("");
    setIsConfigured(false);
  };

  return { userId, isConfigured, setUserId, clearUserId };
}
