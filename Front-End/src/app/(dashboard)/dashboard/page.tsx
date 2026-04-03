import { ApiPingCard } from "@/components/ui/api-ping-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard Front-End GAS</h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Halaman ini menjadi pondasi integrasi modul Presensi, Telemetry, dan GPS.
        </p>
      </section>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ApiPingCard />
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
            <CardDescription>Area ini disiapkan untuk KPI dan metrik dashboard berikutnya.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Komponen dashboard responsif siap untuk data real-time.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
