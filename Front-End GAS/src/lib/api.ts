import type {
  ApiEnvelope,
  BatchAccelRequest,
  BatchAccelResponse,
  CheckinRequest,
  CheckinResponse,
  GenerateQRRequest,
  GenerateQRResponse,
  GPSMarkerResponse,
  GPSPolylineResponse,
  LogGPSRequest,
  LogGPSResponse,
  PresenceStatusResponse,
  RootInfoResponse,
} from "@/types/api";

const baseUrl = "/api/gas";

function resolveApiUrl() {
  return baseUrl;
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  if (!response.ok) {
    return {
      ok: false,
      error: `http_${response.status}`,
    };
  }

  return (await response.json()) as ApiEnvelope<T>;
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const url = new URL(resolveApiUrl(), "http://localhost");

  if (path) {
    url.searchParams.set("path", path);
  }

  const response = await fetch(`${url.pathname}${url.search}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  return parseEnvelope<T>(response);
}

export const api = {
  getRoot: () => request<RootInfoResponse>(""),
  getPresenceStatus: async (params: {
    user_id: string;
    course_id: string;
    session_id: string;
  }) => {
    const url = new URL(resolveApiUrl(), "http://localhost");
    url.searchParams.set("path", "presence/status");
    url.searchParams.set("user_id", params.user_id);
    url.searchParams.set("course_id", params.course_id);
    url.searchParams.set("session_id", params.session_id);

    const response = await fetch(`${url.pathname}${url.search}`, { cache: "no-store" });
    return parseEnvelope<PresenceStatusResponse>(response);
  },
  getGPSMarker: async (device_id: string) => {
    const url = new URL(resolveApiUrl(), "http://localhost");
    url.searchParams.set("path", "sensor/gps/marker");
    url.searchParams.set("device_id", device_id);

    const response = await fetch(`${url.pathname}${url.search}`, { cache: "no-store" });
    return parseEnvelope<GPSMarkerResponse>(response);
  },
  getGPSPolyline: async (params: { device_id: string; from?: string; to?: string }) => {
    const url = new URL(resolveApiUrl(), "http://localhost");
    url.searchParams.set("path", "sensor/gps/polyline");
    url.searchParams.set("device_id", params.device_id);
    if (params.from) url.searchParams.set("from", params.from);
    if (params.to) url.searchParams.set("to", params.to);

    const response = await fetch(`${url.pathname}${url.search}`, { cache: "no-store" });
    return parseEnvelope<GPSPolylineResponse>(response);
  },
  generateQR: (payload: GenerateQRRequest) =>
    request<GenerateQRResponse>("presence/qr/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  checkin: (payload: CheckinRequest) =>
    request<CheckinResponse>("presence/checkin", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logBatchAccel: (payload: BatchAccelRequest) =>
    request<BatchAccelResponse>("sensor/accel/batch", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logGPS: (payload: LogGPSRequest) =>
    request<LogGPSResponse>("sensor/gps", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
