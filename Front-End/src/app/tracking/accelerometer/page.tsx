"use client";

import { useDeviceFingerprint } from "@/hooks/useDeviceFingerprint";
import { useAccelerometer } from "@/hooks/useAccelerometer";
import { useState, useEffect } from "react";
import { ArrowLeft, Activity, StopCircle, Play } from "lucide-react";
import Link from "next/link";

export default function AccelerometerPage() {
  const { deviceId } = useDeviceFingerprint();
  const {
    isRecording,
    currentData,
    samplesCount,
    batchesSent,
    error,
    startRecording,
    stopRecording
  } = useAccelerometer(deviceId);

  // Helper to map values to a visual percentage (-15 to 15 mapped to 0% to 100%)
  const mappedValue = (val: number | null) => {
    if (val === null) return 50;
    // Bound the value between -15 and 15
    const bounded = Math.max(-15, Math.min(15, val));
    return ((bounded + 15) / 30) * 100;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <Link href="/" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold">Accelerometer Sensor</h1>
          </div>
        </div>

        {/* Device Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Device Identity</span>
            <span className="font-mono text-sm mt-1">{deviceId || "Memuat..."}</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium border border-red-200 dark:border-red-800/30">
            ⚠ {error}
          </div>
        )}

        {/* Live Chart (Progress Bars) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 space-y-5 relative overflow-hidden">
          {/* Glassy overlay if not recording */}
          {!isRecording && (
            <div className="absolute inset-0 bg-slate-50/60 dark:bg-slate-900/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
              <span className="bg-black/80 dark:bg-white/90 text-white dark:text-black px-4 py-2 rounded-lg font-medium text-sm shadow-xl backdrop-blur-md">
                Menunggu untuk merekam...
              </span>
            </div>
          )}

          <h2 className="text-sm font-semibold tracking-wide flex justify-between items-center">
            <span>Live Chart (X, Y, Z)</span>
            {isRecording && <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>}
          </h2>
          
          {/* X Axis */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-red-500">X Axis</span>
              <span>{currentData.x !== null ? currentData.x.toFixed(2) : "0.00"}</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
              {/* Center Line Marker */}
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-300 dark:bg-slate-500 z-0 transform -translate-x-1/2"></div>
              <div 
                className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-75 ease-linear relative z-10 rounded-full" 
                style={{ width: `${mappedValue(currentData.x)}%` }}
              ></div>
            </div>
          </div>

          {/* Y Axis */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-green-500">Y Axis</span>
              <span>{currentData.y !== null ? currentData.y.toFixed(2) : "0.00"}</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-300 dark:bg-slate-500 z-0 transform -translate-x-1/2"></div>
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-75 ease-linear relative z-10 rounded-full" 
                style={{ width: `${mappedValue(currentData.y)}%` }}
              ></div>
            </div>
          </div>

          {/* Z Axis */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-blue-500">Z Axis</span>
              <span>{currentData.z !== null ? currentData.z.toFixed(2) : "0.00"}</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-300 dark:bg-slate-500 z-0 transform -translate-x-1/2"></div>
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-75 ease-linear relative z-10 rounded-full" 
                style={{ width: `${mappedValue(currentData.z)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status / Samples</span>
            <span className="text-lg font-bold mt-1">
              {isRecording ? (
                <span className="text-green-500">Merekam...</span>
              ) : (
                <span className="text-slate-400">Idle</span>
              )}
            </span>
            <span className="text-sm mt-1">{samplesCount} buff.</span>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Batch Terkirim</span>
            <span className="text-3xl font-bold mt-1 text-indigo-500">{batchesSent}</span>
            <span className="text-sm mt-1 text-slate-500 dark:text-slate-400 font-medium">~{batchesSent * 50} samples total</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4">
          {isRecording ? (
             <button 
              onClick={stopRecording}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl p-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/30 active:scale-[0.98]"
            >
              <StopCircle className="w-5 h-5" />
              Berhenti Rekam
            </button>
          ) : (
            <button 
              onClick={startRecording}
              disabled={!deviceId}
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold rounded-xl p-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
            >
              <Play className="w-5 h-5 fill-current" />
              Mulai Rekam
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
