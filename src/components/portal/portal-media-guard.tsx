"use client";

import * as React from "react";

function isProtectedTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(".portal-protected-media"));
}

export function PortalMediaGuard() {
  React.useEffect(() => {
    const blockProtected = (event: Event) => {
      if (!isProtectedTarget(event.target)) return;
      event.preventDefault();
    };

    const blockPortalShortcuts = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === "printscreen") {
        event.preventDefault();
        void navigator.clipboard?.writeText("").catch(() => undefined);
        return;
      }

      if (!(event.ctrlKey || event.metaKey)) return;

      if (key === "s" || key === "p" || key === "u" || key === "c") {
        if (
          isProtectedTarget(event.target) ||
          document.querySelector(".portal-protected-media")
        ) {
          event.preventDefault();
        }
      }
    };

    const blockSelection = (event: Event) => {
      if (isProtectedTarget(event.target)) event.preventDefault();
    };

    document.addEventListener("contextmenu", blockProtected);
    document.addEventListener("dragstart", blockProtected);
    document.addEventListener("copy", blockProtected);
    document.addEventListener("cut", blockProtected);
    document.addEventListener("selectstart", blockSelection);
    document.addEventListener("keydown", blockPortalShortcuts);

    return () => {
      document.removeEventListener("contextmenu", blockProtected);
      document.removeEventListener("dragstart", blockProtected);
      document.removeEventListener("copy", blockProtected);
      document.removeEventListener("cut", blockProtected);
      document.removeEventListener("selectstart", blockSelection);
      document.removeEventListener("keydown", blockPortalShortcuts);
    };
  }, []);

  return null;
}
