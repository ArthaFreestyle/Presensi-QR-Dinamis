export default function PresencePage() {
  return (
    <main className="container section stack-md">
      <h1>Presensi QR & Check-in</h1>
      <p className="text-muted">
        Placeholder halaman untuk scanner QR dinamis dan proses check-in.
      </p>
      <section className="card stack-sm">
        <h2>Rencana Integrasi</h2>
        <p className="text-muted">
          Endpoint: <code>presence/qr/generate</code> dan <code>presence/checkin</code>
        </p>
      </section>
    </main>
  );
}
