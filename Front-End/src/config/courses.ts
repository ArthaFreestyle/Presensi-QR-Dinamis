export const AVAILABLE_COURSES = [
  { id: "cloud-101", name: "Cloud Computing" },
  { id: "basdat-201", name: "Basis Data" },
  { id: "jarkom-301", name: "Jaringan Komputer" },
];

// Generate sesi-01 to sesi-16
export const AVAILABLE_SESSIONS = Array.from({ length: 16 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, "0");
  return `sesi-${num}`;
});
