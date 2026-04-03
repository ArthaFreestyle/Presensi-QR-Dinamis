import { ApiPingCard } from "@/components/ui/api-ping-card";

export default function DashboardPage() {
  return (
    <main className="container section stack-md">
      <h1>Dashboard Front-End GAS</h1>
      <p className="text-muted">
        Halaman ini menjadi pondasi integrasi modul Presensi, Telemetry, dan GPS.
      </p>
      <ApiPingCard />
    </main>
  );
}
