import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Presensi QR Dinamis",
  description: "Frontend GAS untuk Presensi QR Dinamis, Telemetry, dan GPS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
