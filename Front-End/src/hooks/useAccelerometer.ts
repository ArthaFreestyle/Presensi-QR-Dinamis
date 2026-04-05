import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { BatchAccelDataItem } from "@/types/api";

interface AccelerometerData {
  x: number | null;
  y: number | null;
  z: number | null;
}

export function useAccelerometer(deviceId: string | null) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentData, setCurrentData] = useState<AccelerometerData>({ x: null, y: null, z: null });
  const [samplesCount, setSamplesCount] = useState(0);
  const [batchesSent, setBatchesSent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const bufferRef = useRef<BatchAccelDataItem[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // To avoid spamming React state (could lag mobile devices), we throttle state updates
  // to about ~10Hz (every 100ms) for the UI, while still buffering every raw event.
  const lastStateUpdateRef = useRef<number>(0);

  const handleDeviceMotion = useCallback((event: DeviceMotionEvent) => {
    if (!event.accelerationIncludingGravity) {
      setError("DeviceMotion is not supported or permission denied.");
      return;
    }

    const { x, y, z } = event.accelerationIncludingGravity;

    const sample: BatchAccelDataItem = {
      x: x !== null ? x : 0,
      y: y !== null ? y : 0,
      z: z !== null ? z : 0,
      t: new Date().toISOString()
    };

    bufferRef.current.push(sample);
    
    const now = Date.now();
    if (now - lastStateUpdateRef.current > 100) {
      setCurrentData({ x, y, z });
      setSamplesCount(bufferRef.current.length); // local buffer count or global? We'll maintain a continuous counter
      lastStateUpdateRef.current = now;
    }
  }, []);

  const sendBatch = useCallback(async () => {
    if (bufferRef.current.length === 0 || !deviceId) return;

    const samples = [...bufferRef.current];
    bufferRef.current = []; // Clear buffer immediately

    try {
      const response = await api.logBatchAccel({
        device_id: deviceId,
        samples,
        ts: new Date().toISOString()
      });

      if (response.ok) {
        setBatchesSent(prev => prev + 1);
      } else {
        console.error("Failed to send accelerometer batch", response.error);
      }
    } catch (err: any) {
      console.error("Exception while sending accelerometer batch:", err);
    }
  }, [deviceId]);

  const startRecording = async () => {
    setError(null);
    if (!deviceId) {
      setError("Waiting for device ID to initialize.");
      return;
    }

    // Handle iOS 13+ permission request
    if (typeof (window as any).DeviceMotionEvent !== 'undefined' && typeof (window as any).DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permission = await (window as any).DeviceMotionEvent.requestPermission();
        if (permission !== 'granted') {
          setError("Izin sensor accelerometer ditolak.");
          return;
        }
      } catch (err: any) {
        setError(`Error requesting permission: ${err.message}`);
        return;
      }
    }

    setSamplesCount(0);
    setBatchesSent(0);
    bufferRef.current = [];

    window.addEventListener("devicemotion", handleDeviceMotion);
    
    // Send batch every 2 seconds for more responsive real-time monitoring
    timerRef.current = setInterval(sendBatch, 2000);
    setIsRecording(true);
  };

  const stopRecording = useCallback(() => {
    window.removeEventListener("devicemotion", handleDeviceMotion);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Flush remaining
    if (bufferRef.current.length > 0) {
      sendBatch();
    }
    
    setIsRecording(false);
  }, [handleDeviceMotion, sendBatch]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording, stopRecording]);

  return {
    isRecording,
    currentData,
    samplesCount,
    batchesSent,
    error,
    startRecording,
    stopRecording
  };
}
