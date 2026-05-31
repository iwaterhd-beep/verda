"use client";

import { PortalCaptureShieldProvider } from "@/components/portal/portal-capture-shield";
import { PortalMediaGuard } from "@/components/portal/portal-media-guard";

export function PortalShellClient({ children }: { children: React.ReactNode }) {
  return (
    <PortalCaptureShieldProvider>
      <PortalMediaGuard />
      {children}
    </PortalCaptureShieldProvider>
  );
}
