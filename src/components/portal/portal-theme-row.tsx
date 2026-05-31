"use client";

import { Moon, Sun } from "lucide-react";
import { usePortalTheme } from "@/components/portal/portal-theme-provider";
import { cn } from "@/lib/utils";

export function PortalThemeRow() {
  const { theme, setTheme } = usePortalTheme();

  return (
    <div className="px-3 py-2">
      <div className="flex min-h-12 items-center gap-3">
        {theme === "dark" ? (
          <Moon className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Sun className="h-4 w-4 shrink-0 text-primary" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Apariencia</p>
          <p className="text-xs text-muted-foreground">
            {theme === "dark" ? "Modo oscuro" : "Modo claro"}
          </p>
        </div>
        <div className="flex rounded-xl border border-border bg-secondary/40 p-1">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={cn(
              "min-h-9 rounded-lg px-3 text-xs font-medium touch-manipulation transition-colors",
              theme === "light"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            Claro
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={cn(
              "min-h-9 rounded-lg px-3 text-xs font-medium touch-manipulation transition-colors",
              theme === "dark"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            Oscuro
          </button>
        </div>
      </div>
    </div>
  );
}
