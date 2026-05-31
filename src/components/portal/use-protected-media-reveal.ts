"use client";

import * as React from "react";
import { useCaptureShield } from "@/components/portal/portal-capture-shield";

export function useProtectedMediaReveal() {
  const captureShield = useCaptureShield();
  const [pressed, setPressed] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  React.useEffect(() => clearTimer, []);

  const revealed = pressed && !captureShield;

  const handlers = {
    onPointerDown: (event: React.PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      clearTimer();
      setPressed(true);
    },
    onPointerUp: () => {
      clearTimer();
      timerRef.current = setTimeout(() => setPressed(false), 100);
    },
    onPointerLeave: () => {
      clearTimer();
      setPressed(false);
    },
    onPointerCancel: () => {
      clearTimer();
      setPressed(false);
    },
  };

  return { revealed, captureShield, handlers };
}
