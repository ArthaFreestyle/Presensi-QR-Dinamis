import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="container section" style={{ paddingBottom: 0 }}>
        <SiteHeader />
      </div>
      {children}
      <SiteFooter />
    </>
  );
}
