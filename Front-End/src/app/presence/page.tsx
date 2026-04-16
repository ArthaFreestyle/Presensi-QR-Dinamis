"use client";

import { useMemo, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { User, Smartphone, LogOut, CheckCircle2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useDeviceFingerprint } from "@/hooks/useDeviceFingerprint";
import { useUserId } from "@/hooks/useUserId";
import { useSwabtestMode } from "@/hooks/useSwabtestMode";

type ParsedQr = {
  qr_token: string;
  course_id: string;
  session_id: string;
  isPartial?: boolean;
};

const backendErrorMessage: Record<string, string> = {
  token_expired: "QR sudah expired, minta dosen generate ulang",
  token_invalid: "QR tidak valid",
  token_already_used: "QR sudah pernah digunakan",
};

function extractQrFromParams(params: URLSearchParams): ParsedQr | null {
  const qrToken = params.get("qr_token");
  const courseId = params.get("course_id");
  const sessionId = params.get("session_id");

  if (!qrToken) return null;

  if (!courseId || !sessionId) {
    return { qr_token: qrToken, course_id: courseId || "", session_id: sessionId || "", isPartial: true };
  }

  return { qr_token: qrToken, course_id: courseId, session_id: sessionId, isPartial: false };
}

function parseQrText(rawValue: string): ParsedQr | null {
  if (!rawValue.trim()) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<ParsedQr>;
    if (parsed.qr_token) {
      if (parsed.course_id && parsed.session_id) {
        return {
          qr_token: parsed.qr_token,
          course_id: parsed.course_id,
          session_id: parsed.session_id,
          isPartial: false,
        };
      } else {
        return {
          qr_token: parsed.qr_token,
          course_id: parsed.course_id || "",
          session_id: parsed.session_id || "",
          isPartial: true,
        };
      }
    }
  } catch {
    // fallback query parsing
  }

  const fromRawParams = extractQrFromParams(new URLSearchParams(rawValue));
  if (fromRawParams) return fromRawParams;

  try {
    const url = new URL(rawValue);
    const fromUrlParams = extractQrFromParams(url.searchParams);
    if (fromUrlParams) return fromUrlParams;
    // invalid URL
  }

  // Fallback: treat the raw value itself as just the token
  return { qr_token: rawValue.trim(), course_id: "", session_id: "", isPartial: true };
}

export default function PresencePage() {
  const { deviceId } = useDeviceFingerprint();
  const { userId, isConfigured, setUserId, clearUserId } = useUserId();
  const { isActive } = useSwabtestMode();

  const [setupInputId, setSetupInputId] = useState("");
  
  const [parsedQr, setParsedQr] = useState<ParsedQr | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [checkinState, setCheckinState] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [statusText, setStatusText] = useState<string>("Belum cek status");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [lastRawValue, setLastRawValue] = useState<string | null>(null);
  const [manualCourseId, setManualCourseId] = useState("");
  const [manualSessionId, setManualSessionId] = useState("");

  const canCheckin = useMemo(() => Boolean(userId.trim() && parsedQr && !parsedQr.isPartial && !isCheckingIn), [userId, parsedQr, isCheckingIn]);

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupInputId.trim()) {
      setUserId(setupInputId.trim());
    }
  };

  const handleScan = (detectedCodes: { rawValue: string }[]) => {
    // Scanner callback returns an array; use the first code for a single check-in flow.
    const rawValue = detectedCodes[0]?.rawValue;
    if (!rawValue) return;
    if (rawValue === lastRawValue) return;
    const parsed = parseQrText(rawValue);
    if (!parsed) {
      setLastRawValue(rawValue);
      setScanError("Format QR tidak dikenali. Pastikan QR presensi valid.");
      return;
    }

    setLastRawValue(rawValue);
    setParsedQr(parsed);
    setScanError(null);
    setCheckinState(null);

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(100);
    }
  };

  const handleCheckin = async () => {
    if (!parsedQr || !userId.trim()) return;
    setIsCheckingIn(true);
    setCheckinState(null);

    const result = await api.checkin({
      user_id: userId.trim(),
      device_id: deviceId || "fp-fallback", // Ensure there's a fallback value here just in case!
      course_id: parsedQr.course_id,
      session_id: parsedQr.session_id,
      qr_token: parsedQr.qr_token,
    });

    if (result.ok) {
      const presenceId = result.data?.presence_id ?? "";
      setCheckinState({ type: "success", message: `Check-in berhasil! Presence ID: ${presenceId}` });
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

  if (isConfigured === null) {
    // Loading state for localStorage
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-8 flex justify-center">
        <p className="text-slate-500 animate-pulse">Memuat pengaturan...</p>
      </main>
    );
  }

  // First-time setup screen
  if (!isConfigured) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              🎓 Selamat Datang
            </CardTitle>
            <CardDescription className="text-base text-slate-600 mt-2">
              Masukkan NIM atau User ID kamu untuk memulai. Data ini akan disimpan secara lokal agar kamu tidak perlu mengisinya lagi setiap kali ingin absen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="setup-user-id">
                  NIM / User ID
                </label>
                <input
                  id="setup-user-id"
                  required
                  autoFocus
                  className="w-full rounded-md border border-slate-300 px-4 py-3 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={setupInputId}
                  onChange={(event) => setSetupInputId(event.target.value)}
                  placeholder="Contoh: 2023xxxx"
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base font-medium">
                Mulai Setup
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Returning user screen
  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6 pb-24">
      <section className="space-y-2 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Presensi QR & Check-in</h1>
          <p className="text-sm text-slate-600">Scan QR untuk absen. Device kamu dikenali otomatis.</p>
          {isActive ? (
            <Badge variant="warning" className="mt-2">
              Mode Swabtest aktif
            </Badge>
          ) : null}
        </div>
      </section>

      {/* Profile Card / User Info Area */}
      <Card className="bg-slate-50/50">
        <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <span className="font-semibold text-slate-800">{userId}</span>
            </div>
            <div className="flex items-center gap-2 max-w-full">
              <Smartphone className="h-4 w-4 text-slate-500 shrink-0" />
              {deviceId ? (
                 <span className="text-xs font-mono text-slate-500 truncate max-w-[200px] sm:max-w-xs px-2 py-0.5 bg-slate-200/60 rounded">
                    {deviceId}
                 </span>
              ) : (
                 <span className="text-xs animate-pulse text-slate-400">mengambil device info...</span>
              )}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
               if(window.confirm("Yakin ingin mengganti NIM? Riwayat di device ini mungkin akan tercatat atas NIM yang baru.")) {
                   clearUserId();
               }
            }}
            className="text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs shrink-0 h-8"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Ganti NIM
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle>Scanner QR</CardTitle>
          <CardDescription>Arahkan kamera ke QR presensi dosen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 aspect-[3/4] sm:aspect-square md:aspect-video flex items-center justify-center relative">
            <Scanner
              constraints={{ facingMode: "environment" }}
              onScan={handleScan}
              onError={() => {
                setScanError("Kamera tidak dapat diakses. Izinkan akses kamera lalu coba lagi.");
              }}
              sound={false}
              classNames={{
                container: "w-full h-full absolute inset-0",
                video: "w-full h-full object-cover rounded-lg",
              }}
            />
            {/* Center target overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
               <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-white/50 rounded-xl rounded-tr-none rounded-bl-none"></div>
            </div>
          </div>

          {scanError ? (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{scanError}</p>
            </div>
          ) : null}

          {parsedQr?.isPartial ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md space-y-3">
              <p className="text-sm text-amber-800 font-medium">
                ⚠️ QR hanya berisi token. Silakan isi Course ID dan Session ID secara manual.
              </p>
              <input
                placeholder="Course ID (contoh: IF1234)"
                value={manualCourseId}
                onChange={(e) => setManualCourseId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              <input
                placeholder="Session ID (contoh: SES-1)"
                value={manualSessionId}
                onChange={(e) => setManualSessionId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              <Button
                onClick={() => {
                  setParsedQr({
                    ...parsedQr,
                    course_id: manualCourseId,
                    session_id: manualSessionId,
                    isPartial: false,
                  });
                }}
                disabled={!manualCourseId.trim() || !manualSessionId.trim()}
                className="w-full"
              >
                Konfirmasi
              </Button>
            </div>
          ) : parsedQr ? (
            <div className="p-3 bg-green-50 text-green-800 text-sm rounded-md border border-green-200">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-semibold">QR Valid</span>
              </div>
              <p className="pl-5 text-green-700">
                Sesi: <span className="font-medium">{parsedQr.course_id}</span> ({parsedQr.session_id})
              </p>
            </div>
          ) : (
            <p className="text-sm text-center text-slate-500 py-1">Menunggu deteksi QR...</p>
          )}

          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
            <Button 
                onClick={handleCheckin} 
                disabled={!canCheckin}
                className="flex-1"
                size="lg"
            >
              {isCheckingIn ? "Memproses absensi..." : "Check-in Sekarang"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleCheckStatus}
              disabled={!parsedQr || isCheckingStatus}
              className="sm:w-32"
            >
              {isCheckingStatus ? "Mengecek..." : "Cek Status"}
            </Button>
          </div>

          {(statusText !== "Belum cek status" || checkinState) && (
            <div className="mt-2 p-3 bg-slate-50 border rounded-md text-sm">
                <p className="text-slate-600 mb-1 font-medium">{statusText}</p>
                {checkinState ? (
                    <p className={checkinState.type === "success" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {checkinState.message}
                    </p>
                ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
