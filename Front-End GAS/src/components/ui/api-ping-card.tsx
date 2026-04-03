"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiRootStatus } from "@/hooks/use-api";

export function ApiPingCard() {
  const { loading, data, error, pingRoot } = useApiRootStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Connectivity</CardTitle>
        <CardDescription>Uji koneksi ke endpoint root GAS (`/exec`) menggunakan environment URL.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={pingRoot} disabled={loading}>
            {loading ? "Mengecek..." : "Test Root Endpoint"}
          </Button>
          {data ? <StatusBadge status="success" label="Connected" /> : null}
          {error ? <StatusBadge status="warning" label="Error" /> : null}
        </div>
        {data ? (
          <p className="text-sm text-slate-600">
            {data.status}: {data.message}
          </p>
        ) : null}
        {error ? <p className="text-sm text-slate-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
