"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchMyOrders, fmtLineQty } from "@/lib/data/orders";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { OrderStatus, Order } from "@/types";

const paymentLabel: Record<Order["paymentMethod"], string> = {
  WALLET: "Monedero",
  CASH: "Efectivo",
  CRYPTO: "Cripto",
};

const statusMeta: Record<
  OrderStatus,
  {
    label: string;
    variant: "warning" | "success" | "secondary" | "destructive";
    icon: React.ElementType;
  }
> = {
  PREPARING: { label: "En preparación", variant: "warning", icon: ChefHat },
  READY: { label: "Listo para recoger", variant: "success", icon: PackageCheck },
  COMPLETED: { label: "Completado", variant: "secondary", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelado", variant: "destructive", icon: Clock },
};

export default function OrdersPage() {
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["my-orders"],
    queryFn: fetchMyOrders,
    refetchInterval: 12_000,
  });

  const readyCount = orders.filter((o) => o.status === "READY").length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Mis pedidos</h1>

      {readyCount > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <PackageCheck className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="font-medium">
                {readyCount === 1
                  ? "¡Tu pedido está listo!"
                  : `¡${readyCount} pedidos listos!`}
              </p>
              <p className="text-sm text-muted-foreground">
                Pasa por el club con tu carnet QR para recogerlo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card className="border-destructive/30">
          <CardContent className="py-10 text-center text-sm text-destructive">
            No se pudieron cargar los pedidos. ¿Has ejecutado el SQL de pedidos?
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-3xl">
            🧾
          </span>
          <p className="mt-4 font-medium">Aún no tienes pedidos</p>
          <Button className="mt-6" asChild>
            <Link href="/portal/menu">Hacer mi primer pedido</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const s = statusMeta[o.status];
            const orderedGrams = o.items
              .filter((i) => i.unit === "g")
              .reduce((a, i) => a + i.qty, 0);
            return (
              <Card
                key={o.id}
                className={cn(
                  o.status === "READY" && "border-primary/40 shadow-glow",
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm font-medium">{o.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(o.createdAt, true)}
                      </p>
                    </div>
                    <Badge variant={s.variant}>
                      <s.icon className="h-3 w-3" /> {s.label}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    {o.items.map((i) => {
                      const served = i.actualQty != null;
                      const margin =
                        served && i.actualQty != null
                          ? Math.round((i.actualQty - i.qty) * 100) / 100
                          : null;
                      return (
                        <div
                          key={i.id}
                          className="rounded-lg border border-border/50 bg-secondary/20 px-3 py-2"
                        >
                          <div className="flex justify-between gap-2">
                            <span className="font-medium">{i.name}</span>
                            <span className="text-muted-foreground">
                              {formatCurrency(i.qty * i.pricePerUnit)}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                            <span>Pedido: {fmtLineQty(i.qty, i.unit)}</span>
                            {served && i.actualQty != null && (
                              <>
                                <span className="text-foreground">
                                  Servido: {fmtLineQty(i.actualQty, i.unit)}
                                </span>
                                {margin !== 0 && (
                                  <span
                                    className={cn(
                                      margin! > 0
                                        ? "text-amber-500"
                                        : "text-sky-400",
                                    )}
                                  >
                                    {margin! > 0 ? "+" : ""}
                                    {i.unit === "g"
                                      ? `${margin!.toFixed(2)}g`
                                      : `${margin} ud`}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-sm text-muted-foreground">
                      {o.status === "PREPARING"
                        ? `${orderedGrams.toFixed(2)}g pedidos`
                        : `${o.grams.toFixed(2)}g servidos`}{" "}
                      · {paymentLabel[o.paymentMethod]}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(o.total)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
