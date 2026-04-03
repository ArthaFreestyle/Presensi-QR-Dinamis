import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PresenceStatusPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Status Presensi</h1>
        <p className="text-sm text-slate-600 sm:text-base">Placeholder halaman untuk pengecekan status presensi mahasiswa.</p>
      </section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Mahasiswa</CardTitle>
            <CardDescription>Ringkasan kehadiran harian.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Endpoint: <code>presence/status</code></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rekap Presensi</CardTitle>
            <CardDescription>Statistik hadir, izin, dan alpha.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Kartu status disiapkan agar responsif untuk mobile dan desktop.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
