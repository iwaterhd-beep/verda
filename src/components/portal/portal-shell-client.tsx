"use client";

import { PortalMediaGuard } from "@/components/portal/portal-media-guard";

export function PortalShellClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PortalMediaGuard />
      {children}
    </>
  );
}
