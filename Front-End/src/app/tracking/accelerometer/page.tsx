"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDeviceFingerprint } from "@/hooks/useDeviceFingerprint";
import { useAccelerometer } from "@/hooks/useAccelerometer";

export default function AccelerometerPage() {
  const { deviceId } = useDeviceFingerprint();
  const { metrics, chartData, startCollection, stopCollection } = useAccelerometer(deviceId);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check device motion support
    if (typeof window !== "undefined" && typeof DeviceMotionEvent === "undefined") {
      setIsSupported(false);
    }
  }, []);

  const handleStart = () => {
    startCollection();
  };

  const handleStop = () => {
    stopCollection();
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      {/* Header */}
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pengumpul Data Akselerometer</h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Kumpulkan data akselerometer real-time dari perangkat Anda dan pantau pembacaan sensor.
        </p>
      </section>

      {/* Device Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Perangkat</CardTitle>
          <CardDescription>Pengenal perangkat unik Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Device ID</p>
            <code className="block rounded bg-slate-100 px-3 py-2 text-xs font-mono text-slate-900">
              {deviceId || "Memuat..."}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Status Pengumpulan</CardTitle>
          <CardDescription>Metrik pengumpulan data akselerometer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Support Check */}
          {!isSupported && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">
                Device Motion API tidak didukung di perangkat ini. Gunakan perangkat mobile dengan dukungan akselerometer.
              </p>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Status Pengumpulan</p>
              <div className="flex items-center gap-2">
                <Badge variant={metrics.isCollecting ? "default" : "secondary"}>
                  {metrics.isCollecting ? "Merekam" : "Berhenti"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Sampel Dikumpulkan</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.samplesCollected}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Batch Dikirim</p>
              <p className="text-2xl font-bold text-slate-900">{metrics.batchesSent}</p>
            </div>
          </div>

          {/* Error Display */}
          {metrics.lastError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-900">Kesalahan</p>
              <p className="text-sm text-red-700">{metrics.lastError}</p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleStart}
              disabled={metrics.isCollecting || !isSupported || !deviceId}
              variant="default"
            >
              Mulai Accelerometer
            </Button>
            <Button onClick={handleStop} disabled={!metrics.isCollecting} variant="secondary">
              Berhenti
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chart Card */}
      <Card>
        <CardHeader>
          <CardTitle>Pembacaan Accelerometer</CardTitle>
          <CardDescription>Data akselerasi real-time dari sumbu X, Y, Z</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="t" 
                    tick={{ fontSize: 12 }}
                    interval={Math.max(0, Math.floor(chartData.length / 8))}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleTimeString("en-US", { 
                        hour: "2-digit", 
                        minute: "2-digit", 
                        second: "2-digit" 
                      });
                    }}
                  />
                  <YAxis label={{ value: "Akselerasi (m/s²)", angle: -90, position: "insideLeft" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
                    formatter={(value) => (typeof value === "number" ? value.toFixed(2) : value)}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        fractionalSecondDigits: 1,
                      });
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="x" stroke="#ef4444" dot={false} name="Sumbu X" strokeWidth={2} />
                  <Line type="monotone" dataKey="y" stroke="#22c55e" dot={false} name="Sumbu Y" strokeWidth={2} />
                  <Line type="monotone" dataKey="z" stroke="#3b82f6" dot={false} name="Sumbu Z" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">Belum ada data yang dikumpulkan</p>
                <p className="mt-1 text-xs text-slate-500">Mulai pengumpulan untuk melihat pembacaan akselerometer</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Cara Kerjanya</CardTitle>
          <CardDescription>Detail teknis tentang pengumpulan data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-slate-900">Proses Pengumpulan</h4>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>• Membaca data akselerometer setiap ~100ms melalui Device Motion API</li>
              <li>• Menyimpan sampel secara lokal di perangkat Anda</li>
              <li>• Secara otomatis mengirim batch ke backend setiap 5 detik</li>
              <li>• Memperbarui grafik dengan data real-time</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-slate-900">Privasi Data</h4>
            <p className="mt-1 text-sm text-slate-600">
              Semua data akselerometer dikumpulkan secara lokal di perangkat Anda dan hanya dikirim ke server dalam batch. ID perangkat Anda
              digunakan untuk identifikasi.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}