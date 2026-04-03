import { useState, useEffect } from "react";
import fpPromise from "@fingerprintjs/fingerprintjs";

export function useDeviceFingerprint() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function generateFingerprint() {
      try {
        const fp = await fpPromise.load();
        const result = await fp.get();
        if (isMounted) {
          setDeviceId(`fp-${result.visitorId}`);
        }
      } catch (error) {
        console.error("Failed to generate fingerprint:", error);
        // Fallback to localStorage + random UUID
        let storedId = localStorage.getItem("presensi_fallback_device_id");
        if (!storedId) {
            // Note: crypto.randomUUID() might not be available in all contexts (e.g., non-secure contexts)
            // but for typical modern browsers it's fine. Using Math.random as a safe fallback just in case.
            storedId = `fp-rnd-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)}`;
            localStorage.setItem("presensi_fallback_device_id", storedId);
        }
        if (isMounted) {
          setDeviceId(storedId);
        }
      }
    }

    generateFingerprint();

    return () => {
      isMounted = false;
    };
  }, []);

  return { deviceId };
}
