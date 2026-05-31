"use client";

import * as React from "react";
import {
  dispatchPortalThemeChange,
  getStoredPortalTheme,
  PORTAL_THEME_STORAGE_KEY,
  type PortalTheme,
} from "@/lib/portal-theme";

interface PortalThemeContextValue {
  theme: PortalTheme;
  setTheme: (theme: PortalTheme) => void;
  toggleTheme: () => void;
}

const PortalThemeContext = React.createContext<PortalThemeContextValue | null>(
  null,
);

export function PortalThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<PortalTheme>(() => {
    if (typeof window === "undefined") return "dark";
    return getStoredPortalTheme();
  });

  const setTheme = React.useCallback((next: PortalTheme) => {
    setThemeState(next);
    localStorage.setItem(PORTAL_THEME_STORAGE_KEY, next);
    dispatchPortalThemeChange(next);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(PORTAL_THEME_STORAGE_KEY, next);
      dispatchPortalThemeChange(next);
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <PortalThemeContext.Provider value={value}>
      <div
        data-portal-theme={theme}
        className="min-h-screen bg-background text-foreground"
      >
        {children}
      </div>
    </PortalThemeContext.Provider>
  );
}

export function usePortalTheme() {
  const context = React.useContext(PortalThemeContext);
  if (!context) {
    throw new Error("usePortalTheme must be used within PortalThemeProvider");
  }
  return context;
}
