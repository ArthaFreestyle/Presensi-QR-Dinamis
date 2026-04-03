export default function TrackingPage() {
  return (
    <main className="container section stack-md">
      <h1>GPS Tracking</h1>
      <p className="text-muted">
        Placeholder halaman untuk map marker dan polyline tracking.
      </p>
      <section className="card stack-sm">
        <h2>Rencana Integrasi</h2>
        <p className="text-muted">
          Endpoint: <code>sensor/gps/marker</code> dan <code>sensor/gps/polyline</code>
        </p>
      </section>
    </main>
  );
}
