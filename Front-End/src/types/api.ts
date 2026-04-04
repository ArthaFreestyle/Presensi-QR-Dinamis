// ─── Generic API Response Envelope ─────────────────────────────

export type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ─── Root API ───────────────────────────────────────────────

export type RootInfoResponse = {
  status: string;
  version?: string;
};

// ─── Accelerometer ──────────────────────────────────────────

export type BatchAccelSample = {
  x: number;
  y: number;
  z: number;
  t: string;
};

export type BatchAccelRequest = {
  device_id: string;
  ts: string;
  samples: BatchAccelSample[];
};

export type BatchAccelResponse = {
  saved: number;
};

// ─── Presence / QR ──────────────────────────────────────────

export type GenerateQRRequest = {
  course_id: string;
  session_id: string;
  ts?: string;
};

export type GenerateQRResponse = {
  qr_token: string;
  expires_at: string;
};

export type CheckinRequest = {
  user_id: string;
  device_id: string;
  course_id: string;
  session_id: string;
  qr_token: string;
  ts?: string;
};

export type CheckinResponse = {
  presence_id: string;
  status: string;
};

export type PresenceStatusResponse = {
  presence_id?: string;
  user_id: string;
  course_id: string;
  session_id: string;
  status: string;
  recorded_at?: string;
};

// ─── GPS ────────────────────────────────────────────────────

export type LogGPSRequest = {
  device_id: string;
  lat: number;
  lng: number;
  ts?: string;
  accuracy?: number;
  altitude?: number;
};

export type LogGPSResponse = {
  recorded: boolean;
};

export type GPSMarkerResponse = {
  device_id: string;
  lat: number;
  lng: number;
  ts: string;
  accuracy?: number;
  altitude?: number;
};

export type GPSPolylineResponse = {
  device_id: string;
  coordinates: Array<{
    lat: number;
    lng: number;
    ts: string;
    accuracy?: number;
    altitude?: number;
  }>;
};