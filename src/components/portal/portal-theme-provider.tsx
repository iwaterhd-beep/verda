"use client";

import * as React from "react";
import {
  getStoredPortalTheme,
  PORTAL_THEME_STORAGE_KEY,
  type PortalTheme,
} from "@/lib/portal-theme";
import { cn } from "@/lib/utils";

interface PortalThemeContextValue {
  theme: PortalTheme;
  setTheme: (theme: PortalTheme) => void;
  toggleTheme: () => void;
}

const PortalThemeContext = React.createContext<PortalThemeContextValue | null>(
  null,
);

export function PortalThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<PortalTheme>("dark");
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setThemeState(getStoredPortalTheme());
    setReady(true);
  }, []);

  const setTheme = React.useCallback((next: PortalTheme) => {
    setThemeState(next);
    localStorage.setItem(PORTAL_THEME_STORAGE_KEY, next);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = React.useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <PortalThemeContext.Provider value={value}>
      <div
        className={cn(
          "min-h-screen bg-background text-foreground",
          ready && theme === "dark" && "dark",
        )}
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
