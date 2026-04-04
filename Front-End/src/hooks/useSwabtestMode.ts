"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import { setGasApiOverrideUrl } from "@/lib/api";

let currentSwabtestUrl: string | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function getSnapshot() {
  return currentSwabtestUrl;
}

export function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function useSwabtestMode() {
  const url = useSyncExternalStore(subscribe, getSnapshot, () => null);

  useEffect(() => {
    setGasApiOverrideUrl(url);
  }, [url]);

  const activate = (nextUrl: string) => {
    if (!isValidHttpUrl(nextUrl)) return false;
    currentSwabtestUrl = nextUrl;
    emitChange();
    return true;
  };

  const deactivate = () => {
    currentSwabtestUrl = null;
    emitChange();
  };

  return useMemo(
    () => ({
      isActive: Boolean(url),
      url,
      activate,
      deactivate,
    }),
    [url]
  );
}
