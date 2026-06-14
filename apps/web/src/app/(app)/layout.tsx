import type { ReactNode } from "react";
import { AppNav } from "@/components/AppNav";
import { OfflineBanner } from "@/components/OfflineBanner";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppNav>
      <OfflineBanner />
      {children}
    </AppNav>
  );
}
