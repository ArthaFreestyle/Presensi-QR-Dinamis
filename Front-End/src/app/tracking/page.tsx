import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrackingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">GPS Tracking</h1>
        <p className="text-sm text-slate-600 sm:text-base">Placeholder halaman untuk map marker dan polyline tracking.</p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Peta Tracking</CardTitle>
          <CardDescription>Area peta dibuat full-viewport di mobile.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[60vh] w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 md:min-h-[28rem]" />
          <p className="mt-4 text-sm text-slate-600">
            Endpoint: <code>sensor/gps/marker</code> dan <code>sensor/gps/polyline</code>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
