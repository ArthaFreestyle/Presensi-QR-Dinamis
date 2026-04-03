import { CircleCheckBig, House, LayoutDashboard, MapPin, QrCode } from "lucide-react";

import type { DockApp } from "@/types/dock";

export const dockApps: DockApp[] = [
  { id: "home", name: "Beranda", href: "/", icon: House },
  { id: "dashboard", name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { id: "presence", name: "Presensi", href: "/presence", icon: QrCode },
  { id: "status", name: "Status", href: "/presence/status", icon: CircleCheckBig },
  { id: "tracking", name: "Tracking", href: "/tracking", icon: MapPin },
];
