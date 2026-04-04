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