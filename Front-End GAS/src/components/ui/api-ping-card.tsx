"use client";

import { useApiRootStatus } from "@/hooks/use-api";
import { StatusBadge } from "@/components/ui/status-badge";

export function ApiPingCard() {
  const { loading, data, error, pingRoot } = useApiRootStatus();

  return (
    <section className="card stack-sm">
      <h2>API Connectivity</h2>
      <p className="text-muted">
        Uji koneksi ke endpoint root GAS (`/exec`) menggunakan environment URL.
      </p>
      <div className="cluster">
        <button className="btn btn-primary" type="button" onClick={pingRoot} disabled={loading}>
          {loading ? "Mengecek..." : "Test Root Endpoint"}
        </button>
        {data ? <StatusBadge status="success" label="Connected" /> : null}
        {error ? <StatusBadge status="warning" label="Error" /> : null}
      </div>
      {data ? (
        <p className="text-muted">
          {data.status}: {data.message}
        </p>
      ) : null}
      {error ? <p className="text-muted">{error}</p> : null}
    </section>
  );
}
