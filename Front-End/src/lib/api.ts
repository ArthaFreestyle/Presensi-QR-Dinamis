import type {
  ApiEnvelope,
  BatchAccelRequest,
  BatchAccelResponse,
  CheckinRequest,
  CheckinResponse,
  GenerateQRRequest,
  GenerateQRResponse,
  GPSLatestResponse,
  GPSHistoryResponse,
  AccelLatestResponse,
  LogGPSRequest,
  LogGPSResponse,
  PresenceStatusResponse,
  RootInfoResponse,
} from "@/types/api";

const basePath = "/api/gas";
let gasApiOverrideUrl: string | null = null;

export function setGasApiOverrideUrl(url: string | null) {
  gasApiOverrideUrl = url;
}

function buildApiUrl(path: string, params?: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  if (path) {
    searchParams.set("path", path);
  }

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, value);
      }
    });
  }

  if (gasApiOverrideUrl) {
    searchParams.set("gas_api_url", gasApiOverrideUrl);
  }

  return `${basePath}?${searchParams.toString()}`;
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
  const url = buildApiUrl(path);

  const response = await fetch(url, {
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
    const url = buildApiUrl("presence/status", params);

    const response = await fetch(url, { cache: "no-store" });
    return parseEnvelope<PresenceStatusResponse>(response);
  },
  getGPSLatest: async (device_id: string) => {
    const url = buildApiUrl("telemetry/gps/latest", { device_id });

    const response = await fetch(url, { cache: "no-store" });
    return parseEnvelope<GPSLatestResponse>(response);
  },
  getGPSHistory: async (params: { device_id: string; limit?: string }) => {
    const url = buildApiUrl("telemetry/gps/history", params);

    const response = await fetch(url, { cache: "no-store" });
    return parseEnvelope<GPSHistoryResponse>(response);
  },
  getAccelLatest: async (device_id: string) => {
    const url = buildApiUrl("telemetry/accel/latest", { device_id });

    const response = await fetch(url, { cache: "no-store" });
    return parseEnvelope<AccelLatestResponse>(response);
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
    request<BatchAccelResponse>("telemetry/accel", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logGPS: (payload: LogGPSRequest) =>
    request<LogGPSResponse>("telemetry/gps", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
