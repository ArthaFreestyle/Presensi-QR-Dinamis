import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Front-End GAS — Presensi QR Dinamis</h1>
        <p className="text-sm text-slate-600 sm:text-base">Fondasi Next.js untuk integrasi dengan GAS Backend API v1.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Mulai</CardTitle>
          <CardDescription>Gunakan menu berikut untuk masuk ke modul yang tersedia.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link href="/presence" className={cn(buttonVariants(), "w-full")}>
              Presensi
            </Link>
            <Link href="/presence/status" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              Status Presensi
            </Link>
            <Link href="/tracking" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              Tracking GPS
            </Link>
            <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
