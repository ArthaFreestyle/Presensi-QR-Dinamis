"use client";

import { BadgeAlert, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSwabtestMode } from "@/hooks/useSwabtestMode";

export function SwabtestModeIndicator() {
  const pathname = usePathname();
  const router = useRouter();
  const { isActive, deactivate } = useSwabtestMode();

  if (!isActive) return null;

  const shouldShowExit = pathname?.startsWith("/swabtest") || pathname?.startsWith("/presence");

  return (
    <div className="sticky top-0 z-40 border-b border-amber-200 bg-amber-50/95 px-4 py-2 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="warning" className="px-2.5 py-1 text-[11px]">
            <BadgeAlert className="h-3.5 w-3.5" />
            Mode Swabtest
          </Badge>
          <p className="text-xs text-amber-900 sm:text-sm">Endpoint GAS mengikuti URL session yang kamu set.</p>
        </div>
        {shouldShowExit ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-amber-300 bg-white/70 text-amber-900 hover:bg-amber-100"
            onClick={() => {
              deactivate();
              if (pathname?.startsWith("/swabtest")) {
                router.push("/");
              }
            }}
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Keluar Mode
          </Button>
        ) : null}
      </div>
    </div>
  );
}
