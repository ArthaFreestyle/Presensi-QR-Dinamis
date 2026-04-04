import type { Metadata, Viewport } from "next";

import { DockNavigation } from "@/components/layout/dock-navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SwabtestModeIndicator } from "@/components/layout/swabtest-mode-indicator";

import "./globals.css";

export const metadata: Metadata = {
  title: "Presensi QR Dinamis",
  description: "Frontend GAS untuk Presensi QR Dinamis, Telemetry, dan GPS",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-background text-foreground antialiased">
        <SwabtestModeIndicator />
        <div className="min-h-svh pb-[calc(6.25rem+env(safe-area-inset-bottom))]">{children}</div>
        <SiteFooter />
        <DockNavigation />
      </body>
    </html>
  );
}
