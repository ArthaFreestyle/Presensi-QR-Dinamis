import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PresencePage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Presensi QR & Check-in</h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Placeholder halaman untuk scanner QR dinamis dan proses check-in.
        </p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Area Scanner QR</CardTitle>
          <CardDescription>Disiapkan full-width untuk pengalaman mobile.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-72 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 sm:min-h-80">
            Scanner QR akan ditampilkan di area ini.
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Endpoint: <code>presence/qr/generate</code> dan <code>presence/checkin</code>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
