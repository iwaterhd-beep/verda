"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import {
  dispatchPortalThemeChange,
  getStoredPortalTheme,
  PORTAL_THEME_CHANGE_EVENT,
  PORTAL_THEME_STORAGE_KEY,
  type PortalTheme,
} from "@/lib/portal-theme";

function usePortalRouteTheme() {
  const pathname = usePathname();
  const isPortal = pathname?.startsWith("/portal") ?? false;

  const [portalTheme, setPortalTheme] = React.useState<PortalTheme>(() => {
    if (typeof window === "undefined") return "dark";
    if (!window.location.pathname.startsWith("/portal")) return "dark";
    return getStoredPortalTheme();
  });

  React.useEffect(() => {
    if (!isPortal) return;
    setPortalTheme(getStoredPortalTheme());

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<PortalTheme>).detail;
      if (detail === "light" || detail === "dark") {
        setPortalTheme(detail);
      }
    };

    window.addEventListener(PORTAL_THEME_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(PORTAL_THEME_CHANGE_EVENT, onChange);
  }, [isPortal]);

  return { isPortal, portalTheme };
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const { isPortal, portalTheme } = usePortalRouteTheme();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      forcedTheme={isPortal ? portalTheme : undefined}
    >
      {children}
    </ThemeProvider>
  );
}

export { dispatchPortalThemeChange, PORTAL_THEME_STORAGE_KEY };
