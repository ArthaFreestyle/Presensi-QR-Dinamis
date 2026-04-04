"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isValidHttpUrl, useSwabtestMode } from "@/hooks/useSwabtestMode";

export default function SwabtestPage() {
  const router = useRouter();
  const { url, activate, deactivate } = useSwabtestMode();
  const [inputUrl, setInputUrl] = useState(url ?? "");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = inputUrl.trim();

    if (!isValidHttpUrl(normalized)) {
      setError("Format URL tidak valid. Gunakan URL http:// atau https:// yang lengkap.");
      return;
    }

    const ok = activate(normalized);
    if (!ok) {
      setError("URL tidak bisa digunakan.");
      return;
    }

    setError(null);
    router.push("/presence");
  };

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Mode Swabtest</h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Set endpoint GAS khusus untuk session ini. Selama mode aktif, semua request ke <code>/api/gas</code> akan
          memakai URL ini.
        </p>
      </section>

      <Card className="border-amber-300 bg-amber-50/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <FlaskConical className="h-5 w-5" />
            Konfigurasi Endpoint
          </CardTitle>
          <CardDescription className="text-amber-800/90">
            URL hanya berlaku selama session halaman ini aktif dan akan hilang saat refresh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="gas-api-url" className="block text-sm font-semibold text-slate-700">
                GAS_API_URL
              </label>
              <input
                id="gas-api-url"
                required
                autoFocus
                value={inputUrl}
                onChange={(event) => setInputUrl(event.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="sm:min-w-40">
                Masuk Mode Swabtest
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  deactivate();
                  setInputUrl("");
                  setError(null);
                }}
              >
                Reset URL Session
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
