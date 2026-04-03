"use client";

import { useRouter, usePathname } from "next/navigation";

import { dockApps } from "@/config/dock-apps";
import { MacOSDock } from "@/components/ui/mac-os-dock";

function isAppActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveActiveApp(pathname: string) {
  const matched = dockApps
    .filter((app) => isAppActive(pathname, app.href))
    .sort((a, b) => b.href.length - a.href.length);

  return matched[0];
}

export function DockNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const activeApp = resolveActiveApp(pathname);

  return (
    <nav
      aria-label="Navigasi utama"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      <MacOSDock
        className="pointer-events-auto w-full max-w-md justify-center"
        apps={dockApps}
        openApps={activeApp ? [activeApp.id] : []}
        onAppClick={(app) => router.push(app.href)}
      />
    </nav>
  );
}
