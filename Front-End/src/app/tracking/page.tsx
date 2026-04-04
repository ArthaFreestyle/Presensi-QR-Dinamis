"use client";

import "leaflet/dist/leaflet.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useDeviceFingerprint } from "@/hooks/useDeviceFingerprint";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PermissionState = "pending" | "granted" | "denied";
type GPSPoint = {
  ts: string | null;
  lat: number | null;
  lng: number | null;
  accuracy_m?: number | null;
};

const DEFAULT_CENTER: [number, number] = [-7.2575, 112.7521];
const TRACK_INTERVAL_MS = 2000; // Faster GPS capture for smoother live tracking
const POLL_INTERVAL_MS = 2000; // Faster data refresh for responsive dashboard
const HISTORY_LIMIT = 200;

function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export default function TrackingPage() {
  const { deviceId } = useDeviceFingerprint();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const polylineRef = useRef<unknown>(null);
  const leafletRef = useRef<unknown>(null);

  const [inputDeviceId, setInputDeviceId] = useState("");
  const [trackingActive, setTrackingActive] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("pending");
  const [sentPoints, setSentPoints] = useState(0);
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(null);
  const [latest, setLatest] = useState<GPSPoint | null>(null);
  const [history, setHistory] = useState<GPSPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (inputDeviceId || !deviceId) return;
    setInputDeviceId(deviceId);
  }, [deviceId, inputDeviceId]);

  const normalizedDeviceId = useMemo(() => inputDeviceId.trim(), [inputDeviceId]);

  useEffect(() => {
    let mounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapRef.current) return;

      const leaflet = await import("leaflet");
      if (!mounted || !mapContainerRef.current || mapRef.current) return;

      // Fix broken default marker icons caused by webpack asset hashing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      leafletRef.current = leaflet;
      const map = leaflet.map(mapContainerRef.current, {
        zoomControl: true,
      });
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        })
        .addTo(map);
      map.setView(DEFAULT_CENTER, 13);
      mapRef.current = map;

      // Force tile recalculation after mount — fixes blank/gray map on first load
      window.setTimeout(() => { map.invalidateSize(); }, 100);
    }

    initMap();
    return () => {
      mounted = false;
      const map = mapRef.current as { remove: () => void } | null;
      if (map) map.remove();
      mapRef.current = null;
      markerRef.current = null;
      polylineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!("permissions" in navigator) || !navigator.permissions?.query) return;

    let permissionStatus: PermissionStatus | null = null;
    const update = (state: PermissionState) => setPermission(state);

    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        permissionStatus = result;
        if (result.state === "granted" || result.state === "denied") {
          update(result.state);
        }
        result.onchange = () => {
          const current = result.state;
          if (current === "granted" || current === "denied") update(current);
        };
      })
      .catch(() => undefined);

    return () => {
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  const refreshMapData = useCallback(async () => {
    if (!normalizedDeviceId) return;

    const latestUrl = `/api/gas?path=telemetry/gps/latest&device_id=${encodeURIComponent(normalizedDeviceId)}`;
    const historyUrl = `/api/gas?path=telemetry/gps/history&device_id=${encodeURIComponent(normalizedDeviceId)}&limit=${HISTORY_LIMIT}`;

    try {
      const [latestRes, historyRes] = await Promise.all([fetch(latestUrl, { cache: "no-store" }), fetch(historyUrl, { cache: "no-store" })]);
      const latestPayload = (await latestRes.json()) as { ok: boolean; data?: Record<string, unknown> };
      const historyPayload = (await historyRes.json()) as { ok: boolean; data?: { items?: Array<Record<string, unknown>> } };

      if (!latestRes.ok || !latestPayload.ok) throw new Error("Gagal mengambil titik terbaru");
      if (!historyRes.ok || !historyPayload.ok) throw new Error("Gagal mengambil riwayat GPS");

      const latestData = latestPayload.data ?? {};
      setLatest({
        ts: typeof latestData.ts === "string" ? latestData.ts : null,
        lat: toNumber(latestData.lat),
        lng: toNumber(latestData.lng),
        accuracy_m: toNumber(latestData.accuracy_m),
      });

      const items = historyPayload.data?.items ?? [];
      setHistory(
        items
          .map((item) => ({
            ts: typeof item.ts === "string" ? item.ts : null,
            lat: toNumber(item.lat),
            lng: toNumber(item.lng),
            accuracy_m: toNumber(item.accuracy_m),
          }))
          .filter((item) => item.lat !== null && item.lng !== null)
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil data GPS");
    }
  }, [normalizedDeviceId]);

  const postPoint = useCallback(
    async (point: { ts: string; lat: number; lng: number; accuracy_m?: number }, retries = 1) => {
      try {
        const response = await fetch("/api/gas?path=telemetry/gps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device_id: normalizedDeviceId,
            ts: point.ts,
            lat: point.lat,
            lng: point.lng,
            accuracy_m: point.accuracy_m,
          }),
        });
        const payload = (await response.json()) as { ok: boolean };
        if (!response.ok || !payload.ok) throw new Error("Upload GPS gagal");

        setSentPoints((prev) => prev + 1);
        setError(null);
      } catch (err) {
        if (retries > 0) {
          window.setTimeout(() => {
            void postPoint(point, retries - 1);
          }, 2000);
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal mengirim lokasi");
      }
    },
    [normalizedDeviceId]
  );

  const captureAndSend = useCallback(() => {
    if (!normalizedDeviceId || !("geolocation" in navigator)) {
      setError("Geolocation tidak didukung di browser ini");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          ts: new Date().toISOString(),
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy_m: position.coords.accuracy,
        };

        setPermission("granted");
        setLastAccuracy(point.accuracy_m);
        setLatest(point);
        setHistory((prev) => {
          const next = [...prev, point];
          return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
        });
        void postPoint(point);
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setPermission("denied");
          setTrackingActive(false);
        }
        setError(geoError.message || "Gagal membaca GPS");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  }, [normalizedDeviceId, postPoint]);

  useEffect(() => {
    if (!normalizedDeviceId) return;
    void refreshMapData();
    const poller = window.setInterval(() => {
      void refreshMapData();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(poller);
  }, [normalizedDeviceId, refreshMapData]);

  useEffect(() => {
    if (!trackingActive) return;
    captureAndSend();
    const tracker = window.setInterval(captureAndSend, TRACK_INTERVAL_MS);
    return () => window.clearInterval(tracker);
  }, [captureAndSend, trackingActive]);

  useEffect(() => {
    const leaflet = leafletRef.current as typeof import("leaflet") | null;
    const map = mapRef.current as import("leaflet").Map | null;
    if (!leaflet || !map) return;

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current as import("leaflet").Layer);
      polylineRef.current = null;
    }
    if (markerRef.current) {
      map.removeLayer(markerRef.current as import("leaflet").Layer);
      markerRef.current = null;
    }

    const latLngHistory = history
      .filter((item) => item.lat !== null && item.lng !== null)
      .map((item) => [item.lat as number, item.lng as number] as [number, number]);

    if (latLngHistory.length > 1) {
      const polyline = leaflet.polyline(latLngHistory, { color: "#2563eb", weight: 4, opacity: 0.8 }).addTo(map);
      polylineRef.current = polyline;
    }

    const latestLat = latest?.lat ?? null;
    const latestLng = latest?.lng ?? null;
    if (latestLat !== null && latestLng !== null) {
      const marker = leaflet.circleMarker([latestLat, latestLng], {
        radius: 8,
        color: "#ef4444",
        fillColor: "#ef4444",
        fillOpacity: 0.9,
        weight: 2,
      });
      marker.addTo(map);
      markerRef.current = marker;
      map.setView([latestLat, latestLng], 16);
      return;
    }

    if (latLngHistory.length > 1) {
      map.fitBounds(leaflet.latLngBounds(latLngHistory), { padding: [24, 24] });
    }
  }, [history, latest]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">GPS Tracking</h1>
        <p className="text-sm text-slate-600 sm:text-base">Marker posisi terbaru dan polyline jejak perjalanan perangkat.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Kontrol Tracking</CardTitle>
          <CardDescription>Semua request dikirim lewat proxy <code>/api/gas</code>.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              value={inputDeviceId}
              onChange={(event) => setInputDeviceId(event.target.value)}
              placeholder="Masukkan device_id"
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring/50 focus-visible:ring-[3px]"
            />
            <Button onClick={() => setTrackingActive(true)} disabled={trackingActive || !normalizedDeviceId}>
              Start
            </Button>
            <Button variant="outline" onClick={() => setTrackingActive(false)} disabled={!trackingActive}>
              Stop
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={trackingActive ? "success" : "secondary"}>Tracking: {trackingActive ? "aktif" : "nonaktif"}</Badge>
            <Badge variant={permission === "granted" ? "success" : permission === "denied" ? "warning" : "secondary"}>
              GPS Permission: {permission}
            </Badge>
            <Badge variant="secondary">Titik terkirim: {sentPoints}</Badge>
            <Badge variant="secondary">Akurasi: {lastAccuracy ? `${lastAccuracy.toFixed(1)} m` : "-"}</Badge>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Peta Tracking</CardTitle>
          <CardDescription>Center default Surabaya (-7.2575, 112.7521). Marker auto-refresh setiap polling.</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={mapContainerRef} className="min-h-[60vh] w-full rounded-lg border border-slate-300 bg-slate-50 md:min-h-[28rem]" />
          <p className="mt-3 text-sm text-slate-600">
            Titik history: {history.length} {latest?.ts ? `• Update terakhir: ${latest.ts}` : ""} • Endpoint: <code>telemetry/gps/latest</code> dan <code>telemetry/gps/history</code>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
