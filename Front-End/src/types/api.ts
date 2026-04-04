export type SuccessEnvelope<T> = {
  ok: true;
  data: T;
};

export type ErrorEnvelope = {
  ok: false;
  error: string;
};

export type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

export type GenerateQRRequest = {
  course_id: string;
  session_id: string;
  ts?: string;
};

export type CheckinRequest = {
  user_id: string;
  device_id?: string;
  course_id: string;
  session_id: string;
  qr_token: string;
  ts?: string;
};

export type BatchAccelDataItem = {
  x?: number;
  y?: number;
  z?: number;
  t?: string;
};

export type BatchAccelRequest = {
  device_id: string;
  ts?: string;
  samples: BatchAccelDataItem[];
};

export type LogGPSRequest = {
  device_id: string;
  lat: number;
  lng: number;
  accuracy_m?: number;
  ts?: string;
};

export type GenerateQRResponse = {
  qr_token: string;
  expires_at: string;
};

export type CheckinResponse = {
  presence_id: string;
  status: "checked_in";
};

export type BatchAccelResponse = {
  accepted: number;
};

export type AccelLatestResponse = {
  t: string | null;
  x: number | null;
  y: number | null;
  z: number | null;
};

export type LogGPSResponse = {
  accepted: boolean;
};

export type PresenceStatusResponse = {
  user_id: string;
  course_id: string;
  session_id: string;
  status: "checked_in" | "not_checked_in";
  last_ts?: string;
};

export type GPSLatestResponse = {
  ts: string | null;
  lat: number | null;
  lng: number | null;
  accuracy_m: number | null;
};

export type GPSHistoryItem = {
  ts: string;
  lat: number;
  lng: number;
};

export type GPSHistoryResponse = {
  device_id: string;
  items: GPSHistoryItem[];
};

export type RootInfoResponse = {
  status: string;
  message: string;
};
