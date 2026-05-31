"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortalTheme } from "@/components/portal/portal-theme-provider";
import { cn } from "@/lib/utils";

export function PortalThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = usePortalTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("touch-target", className)}
      aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
      onClick={toggleTheme}
    >
      {mounted && theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
