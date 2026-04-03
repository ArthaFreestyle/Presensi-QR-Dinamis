"use client";

import { useMemo, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

type ParsedQr = {
  qr_token: string;
  course_id: string;
  session_id: string;
};

const backendErrorMessage: Record<string, string> = {
  token_expired: "QR sudah expired, minta dosen generate ulang",
  token_invalid: "QR tidak valid",
  token_already_used: "QR sudah pernah digunakan",
};

function parseQrText(rawValue: string): ParsedQr | null {
  if (!rawValue.trim()) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<ParsedQr>;
    if (parsed.qr_token && parsed.course_id && parsed.session_id) {
      return {
        qr_token: parsed.qr_token,
        course_id: parsed.course_id,
        session_id: parsed.session_id,
      };
    }
  } catch {
    // fallback query parsing
  }

  const params = new URLSearchParams(rawValue);
  const qr_token = params.get("qr_token");
  const course_id = params.get("course_id");
  const session_id = params.get("session_id");
  if (qr_token && course_id && session_id) {
    return { qr_token, course_id, session_id };
  }

  try {
    const url = new URL(rawValue);
    const qpQrToken = url.searchParams.get("qr_token");
    const qpCourseId = url.searchParams.get("course_id");
    const qpSessionId = url.searchParams.get("session_id");
    if (qpQrToken && qpCourseId && qpSessionId) {
      return {
        qr_token: qpQrToken,
        course_id: qpCourseId,
        session_id: qpSessionId,
      };
    }
  } catch {
    // invalid URL
  }

  return null;
}

export default function PresencePage() {
  const [userId, setUserId] = useState("");
  const [deviceId, setDeviceId] = useState("web-browser");
  const [parsedQr, setParsedQr] = useState<ParsedQr | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [checkinState, setCheckinState] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [statusText, setStatusText] = useState<string>("Belum cek status");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const canCheckin = useMemo(() => Boolean(userId.trim() && parsedQr && !isCheckingIn), [userId, parsedQr, isCheckingIn]);

  const handleScan = (detectedCodes: { rawValue: string }[]) => {
    const rawValue = detectedCodes[0]?.rawValue;
    if (!rawValue) return;
    const parsed = parseQrText(rawValue);
    if (!parsed) {
      setScanError("Format QR tidak dikenali. Pastikan QR presensi valid.");
      return;
    }

    setParsedQr(parsed);
    setScanError(null);
    setCheckinState(null);

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(100);
    }
  };

  const handleCheckin = async () => {
    if (!parsedQr || !userId.trim()) return;
    setIsCheckingIn(true);
    setCheckinState(null);

    const result = await api.checkin({
      user_id: userId.trim(),
      device_id: deviceId.trim() || "web-browser",
      course_id: parsedQr.course_id,
      session_id: parsedQr.session_id,
      qr_token: parsedQr.qr_token,
    });

    if (result.ok) {
      setCheckinState({ type: "success", message: "Check-in berhasil." });
      setStatusText("Status terkini: checked_in");
    } else {
      setCheckinState({
        type: "error",
        message: backendErrorMessage[result.error] ?? `Check-in gagal (${result.error})`,
      });
    }

    setIsCheckingIn(false);
  };

  const handleCheckStatus = async () => {
    if (!parsedQr || !userId.trim()) return;
    setIsCheckingStatus(true);
    const result = await api.getPresenceStatus({
      user_id: userId.trim(),
      course_id: parsedQr.course_id,
      session_id: parsedQr.session_id,
    });

    if (result.ok) {
      setStatusText(`Status terkini: ${result.data.status}`);
    } else {
      setStatusText(`Gagal cek status (${result.error})`);
    }
    setIsCheckingStatus(false);
  };

  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Presensi QR & Check-in</h1>
        <p className="text-sm text-slate-600">Scan QR, cek status, lalu lakukan check-in melalui proxy API.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Scanner QR</CardTitle>
          <CardDescription>Arahkan kamera ke QR presensi. Dioptimalkan untuk mobile portrait.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <Scanner
              constraints={{ facingMode: "environment" }}
              onScan={handleScan}
              onError={() => {
                setScanError("Kamera tidak dapat diakses. Izinkan akses kamera lalu coba lagi.");
              }}
              sound={false}
              classNames={{
                container: "w-full",
                video: "w-full aspect-[3/4] bg-black object-cover",
              }}
            />
          </div>
          {scanError ? <p className="text-sm text-red-600">{scanError}</p> : null}
          {parsedQr ? (
            <p className="text-sm text-slate-700">
              QR terbaca — <span className="font-medium">{parsedQr.course_id}</span> /{" "}
              <span className="font-medium">{parsedQr.session_id}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-500">Menunggu QR valid...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Check-in</CardTitle>
          <CardDescription>Masukkan NIM/user_id, lalu lakukan check-in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="user-id">
              User ID
            </label>
            <input
              id="user-id"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Contoh: 2023xxxx"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="device-id">
              Device ID
            </label>
            <input
              id="device-id"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value)}
              placeholder="Contoh: dev-001"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleCheckin} disabled={!canCheckin}>
              {isCheckingIn ? "Memproses..." : "Check-in"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCheckStatus}
              disabled={!userId.trim() || !parsedQr || isCheckingStatus}
            >
              {isCheckingStatus ? "Mengecek..." : "Cek Status"}
            </Button>
          </div>
          <p className="text-sm text-slate-600">{statusText}</p>
          {checkinState ? (
            <p className={checkinState.type === "success" ? "text-sm text-green-600" : "text-sm text-red-600"}>
              {checkinState.message}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
