"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import type { BatchAccelRequest } from "@/types/api";

export interface AccelSample {
  t: string;
  x: number;
  y: number;
  z: number;
}

export interface AccelMetrics {
  samplesCollected: number;
  batchesSent: number;
  isCollecting: boolean;
  lastError: string | null;
}

export function useAccelerometer(deviceId: string | null) {
  const [metrics, setMetrics] = useState<AccelMetrics>({
    samplesCollected: 0,
    batchesSent: 0,
    isCollecting: false,
    lastError: null,
  });

  const [chartData, setChartData] = useState<AccelSample[]>([]);

  // Use refs for continuous data collection without re-renders
  const samplesBufferRef = useRef<AccelSample[]>([]);
  const isCollectingRef = useRef(false);
  const listenerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle device motion events
  const handleDeviceMotion = useCallback((event: DeviceMotionEvent) => {
    if (!isCollectingRef.current || !event.acceleration) return;

    const now = new Date().toISOString();
    const sample: AccelSample = {
      t: now,
      x: Math.round((event.acceleration.x || 0) * 100) / 100,
      y: Math.round((event.acceleration.y || 0) * 100) / 100,
      z: Math.round((event.acceleration.z || 0) * 100) / 100,
    };

    samplesBufferRef.current.push(sample);

    // Update metrics and chart data
    setMetrics((prev) => ({
      ...prev,
      samplesCollected: prev.samplesCollected + 1,
    }));

    // Keep only last 100 samples in chart
    setChartData((prev) => {
      const updated = [...prev, sample];
      return updated.length > 100 ? updated.slice(-100) : updated;
    });
  }, []);

  // Send batch data every 5 seconds
  const sendBatch = useCallback(async () => {
    if (!deviceId || samplesBufferRef.current.length === 0) return;

    const batch: BatchAccelRequest = {
      device_id: deviceId,
      ts: new Date().toISOString(),
      samples: samplesBufferRef.current,
    };

    try {
      const result = await api.logBatchAccel(batch);

      if (!result.ok) {
        setMetrics((prev) => ({
          ...prev,
          lastError: result.error || "Failed to send batch",
        }));
        return;
      }

      // Clear buffer on successful send
      samplesBufferRef.current = [];
      setMetrics((prev) => ({
        ...prev,
        batchesSent: prev.batchesSent + 1,
        lastError: null,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setMetrics((prev) => ({
        ...prev,
        lastError: errorMsg,
      }));
    }
  }, [deviceId]);

  // Start collecting accelerometer data
  const startCollection = useCallback(() => {
    if (!deviceId || isCollectingRef.current) return;

    isCollectingRef.current = true;
    listenerRef.current = handleDeviceMotion;

    // Request permission for iOS 13+
    if (typeof DeviceMotionEvent !== "undefined" && "requestPermission" in DeviceMotionEvent) {
      (DeviceMotionEvent as any)
        .requestPermission()
        .then((permission: string) => {
          if (permission === "granted") {
            window.addEventListener("devicemotion", listenerRef.current!);
          }
        })
        .catch(() => {
          setMetrics((prev) => ({
            ...prev,
            lastError: "Permission denied for device motion",
          }));
        });
    } else {
      // Non-iOS or older iOS devices
      window.addEventListener("devicemotion", listenerRef.current);
    }

    // Set up batch sending interval (5 seconds)
    sendIntervalRef.current = setInterval(sendBatch, 5000);

    setMetrics((prev) => ({
      ...prev,
      isCollecting: true,
      lastError: null,
    }));
  }, [deviceId, handleDeviceMotion, sendBatch]);

  // Stop collecting accelerometer data
  const stopCollection = useCallback(() => {
    isCollectingRef.current = false;

    if (listenerRef.current) {
      window.removeEventListener("devicemotion", listenerRef.current);
      listenerRef.current = null;
    }

    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }

    // Send any remaining samples
    sendBatch();

    setMetrics((prev) => ({
      ...prev,
      isCollecting: false,
    }));
  }, [sendBatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isCollectingRef.current) {
        stopCollection();
      }
    };
  }, [stopCollection]);

  return {
    metrics,
    chartData,
    startCollection,
    stopCollection,
  };
}
