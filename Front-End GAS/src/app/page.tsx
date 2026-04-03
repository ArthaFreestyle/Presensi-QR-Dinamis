import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <>
      <main className="container section stack-md">
        <SiteHeader />
        <h1>Front-End GAS — Presensi QR Dinamis</h1>
        <p className="text-muted">
          Fondasi Next.js untuk integrasi dengan GAS Backend API v1.
        </p>

        <div className="card stack-sm">
          <h2>Mulai</h2>
          <p className="text-muted">
            Gunakan menu berikut untuk masuk ke modul yang tersedia.
          </p>
          <div className="cluster">
            <Link className="btn btn-primary" href="/presence">
              Presensi
            </Link>
            <Link className="btn" href="/presence/status">
              Status Presensi
            </Link>
            <Link className="btn" href="/tracking">
              Tracking GPS
            </Link>
            <Link className="btn" href="/dashboard">
              Dashboard
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
