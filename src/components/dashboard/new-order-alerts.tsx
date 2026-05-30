"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchClubOrders } from "@/lib/data/orders";
import {
  playNewOrderAlertSound,
  unlockOrderAlertSound,
} from "@/lib/order-alert-sound";
import { formatCurrency } from "@/lib/utils";

/**
 * Escucha pedidos PREPARING y avisa (sonido + toast) cuando entra uno nuevo.
 */
export function NewOrderAlerts() {
  const knownIds = React.useRef<Set<string> | null>(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["club-orders"],
    queryFn: fetchClubOrders,
    refetchInterval: 12_000,
  });

  React.useEffect(() => {
    const unlock = () => unlockOrderAlertSound();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  React.useEffect(() => {
    const preparing = orders.filter((o) => o.status === "PREPARING");
    const ids = new Set(preparing.map((o) => o.id));

    if (knownIds.current === null) {
      knownIds.current = ids;
      return;
    }

    const fresh = preparing.filter((o) => !knownIds.current!.has(o.id));
    knownIds.current = ids;

    for (const order of fresh) {
      playNewOrderAlertSound();
      toast("Nuevo pedido online", {
        description: `${order.code} · ${order.memberName} · ${formatCurrency(order.total)}`,
        action: {
          label: "Ver",
          onClick: () => {
            window.location.href = "/pedidos";
          },
        },
        duration: 12_000,
      });
    }
  }, [orders]);

  return null;
}
