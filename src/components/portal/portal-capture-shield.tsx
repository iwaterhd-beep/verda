"use client";

import * as React from "react";

const CaptureShieldContext = React.createContext(false);

/** Oculta media al cambiar de app o en el flash típico de captura en iOS. */
export function PortalCaptureShieldProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    let revealTimer: ReturnType<typeof setTimeout> | undefined;
    let hiddenAt = 0;

    const activate = () => {
      if (revealTimer) clearTimeout(revealTimer);
      setActive(true);
    };

    const scheduleDeactivate = (delay = 500) => {
      if (revealTimer) clearTimeout(revealTimer);
      revealTimer = setTimeout(() => setActive(false), delay);
    };

    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        activate();
        return;
      }
      const flashMs = Date.now() - hiddenAt;
      if (hiddenAt > 0 && flashMs < 350) {
        activate();
        scheduleDeactivate(800);
        return;
      }
      scheduleDeactivate(400);
    };

    const onPageHide = () => activate();
    const onPageShow = () => scheduleDeactivate(500);
    const onBlur = () => activate();
    const onFocus = () => scheduleDeactivate(450);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      if (revealTimer) clearTimeout(revealTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.documentElement.classList.remove("portal-capture-shield");
    };
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle("portal-capture-shield", active);
  }, [active]);

  return (
    <CaptureShieldContext.Provider value={active}>
      {children}
    </CaptureShieldContext.Provider>
  );
}

export function useCaptureShield() {
  return React.useContext(CaptureShieldContext);
}
