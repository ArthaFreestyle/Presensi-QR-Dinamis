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
  ts?: string;
};

export type BatchAccelRequest = {
  device_id: string;
  ts?: string;
  data: BatchAccelDataItem[];
};

export type LogGPSRequest = {
  device_id: string;
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number;
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
  saved: number;
};

export type LogGPSResponse = {
  recorded: boolean;
};

export type PresenceStatusResponse = {
  user_id: string;
  course_id: string;
  session_id: string;
  status: "checked_in" | "not_checked_in";
  last_ts?: string;
};

export type GPSMarkerResponse = {
  device_id: string;
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number;
  ts: string;
};

export type GPSPolylinePoint = {
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number;
  ts: string;
};

export type GPSPolylineResponse = {
  device_id: string;
  from: string;
  to: string;
  count: number;
  points: GPSPolylinePoint[];
};

export type RootInfoResponse = {
  status: string;
  message: string;
};
