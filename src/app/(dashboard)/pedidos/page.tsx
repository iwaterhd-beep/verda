"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChefHat,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkReadyDialog } from "@/components/pedidos/mark-ready-dialog";
import { cancelOrderAction } from "@/app/(dashboard)/pedidos/actions";
import {
  fetchClubOrders,
  fmtLineQty,
  updateOrderStatus,
} from "@/lib/data/orders";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { ClubOrder, Order, OrderStatus } from "@/types";

const paymentLabel: Record<Order["paymentMethod"], string> = {
  WALLET: "Monedero",
  CASH: "Efectivo",
  CRYPTO: "Cripto",
};

const statusMeta: Record<
  OrderStatus,
  { label: string; variant: "warning" | "success" | "secondary" | "destructive" }
> = {
  PREPARING: { label: "En preparación", variant: "warning" },
  READY: { label: "Listo para recoger", variant: "success" },
  COMPLETED: { label: "Completado", variant: "secondary" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
};

export default function PedidosPage() {
  const queryClient = useQueryClient();
  const [readyOrder, setReadyOrder] = React.useState<ClubOrder | null>(null);

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["club-orders"],
    queryFn: fetchClubOrders,
    refetchInterval: 15_000,
  });

  const preparing = orders.filter((o) => o.status === "PREPARING");
  const ready = orders.filter((o) => o.status === "READY");
  const done = orders.filter(
    (o) => o.status === "COMPLETED" || o.status === "CANCELLED",
  );

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["club-orders"] });
    queryClient.invalidateQueries({ queryKey: ["club-products"] });
  }

  async function setStatus(order: ClubOrder, status: OrderStatus) {
    try {
      await updateOrderStatus(order.id, status);
      refresh();
      toast.success("Pedido actualizado", { description: order.code });
    } catch (e) {
      toast.error("No se pudo actualizar", {
        description: (e as Error).message,
      });
    }
  }

  async function cancelOrder(order: ClubOrder) {
    try {
      const res = await cancelOrderAction(order.id);
      if (res.error) {
        toast.error("No se pudo cancelar", { description: res.error });
        return;
      }
      refresh();
      toast.success("Pedido cancelado", {
        description: res.refunded
          ? `${order.code} · ${formatCurrency(res.refunded)} devueltos al monedero`
          : order.code,
      });
    } catch (e) {
      toast.error("No se pudo cancelar", {
        description: (e as Error).message,
      });
    }
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        title="Pedidos del portal"
        description="Pedidos online de socios. Al marcar listo, registra el peso real y se descuenta del stock."
      />

      {isLoading ? (
        <Card>
          <CardContent className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-destructive">
              No se pudieron cargar los pedidos. ¿Has ejecutado el SQL
              (orders, order_items, products)?
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="preparing">
          <TabsList className="mb-4 w-full justify-start overflow-x-auto">
            <TabsTrigger value="preparing">
              En preparación ({preparing.length})
            </TabsTrigger>
            <TabsTrigger value="ready">Listos ({ready.length})</TabsTrigger>
            <TabsTrigger value="done">Historial ({done.length})</TabsTrigger>
            <TabsTrigger value="all">Todos ({orders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="preparing">
            <OrderList
              orders={preparing}
              empty="No hay pedidos pendientes de preparar."
              onMarkReady={setReadyOrder}
              onStatus={setStatus}
              onCancel={cancelOrder}
            />
          </TabsContent>
          <TabsContent value="ready">
            <OrderList
              orders={ready}
              empty="No hay pedidos listos para recoger."
              onMarkReady={setReadyOrder}
              onStatus={setStatus}
              onCancel={cancelOrder}
            />
          </TabsContent>
          <TabsContent value="done">
            <OrderList
              orders={done}
              empty="Sin historial."
              onMarkReady={setReadyOrder}
              onStatus={setStatus}
              onCancel={cancelOrder}
            />
          </TabsContent>
          <TabsContent value="all">
            <OrderList
              orders={orders}
              empty="Aún no hay pedidos del portal."
              onMarkReady={setReadyOrder}
              onStatus={setStatus}
              onCancel={cancelOrder}
            />
          </TabsContent>
        </Tabs>
      )}

      <MarkReadyDialog
        order={readyOrder}
        open={!!readyOrder}
        onOpenChange={(o) => !o && setReadyOrder(null)}
        onSuccess={refresh}
      />
    </div>
  );
}

function OrderList({
  orders,
  empty,
  onMarkReady,
  onStatus,
  onCancel,
}: {
  orders: ClubOrder[];
  empty: string;
  onMarkReady: (o: ClubOrder) => void;
  onStatus: (o: ClubOrder, s: OrderStatus) => void;
  onCancel: (o: ClubOrder) => void;
}) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          {empty}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const s = statusMeta[o.status];
        const orderedGrams = o.items
          .filter((i) => i.unit === "g")
          .reduce((a, i) => a + i.qty, 0);
        return (
          <Card key={o.id}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-semibold">{o.code}</p>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(o.createdAt, true)}
                  </p>
                  <Link
                    href={`/socios/${o.memberId}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <User className="h-3.5 w-3.5" />
                    {o.memberName}
                  </Link>
                  <ul className="mt-3 space-y-2 text-sm">
                    {o.items.map((i) => {
                      const served = i.actualQty != null;
                      const margin =
                        served && i.actualQty != null
                          ? Math.round((i.actualQty - i.qty) * 100) / 100
                          : null;
                      return (
                        <li
                          key={i.id}
                          className="rounded-lg border border-border/50 bg-secondary/20 px-3 py-2"
                        >
                          <div className="flex justify-between gap-4">
                            <span className="font-medium">{i.name}</span>
                            <span className="text-muted-foreground">
                              {formatCurrency(i.qty * i.pricePerUnit)}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span>Pedido: {fmtLineQty(i.qty, i.unit)}</span>
                            {served && i.actualQty != null && (
                              <>
                                <span className="text-foreground">
                                  Real: {fmtLineQty(i.actualQty, i.unit)}
                                </span>
                                {margin !== 0 && (
                                  <span
                                    className={cn(
                                      margin! > 0
                                        ? "text-amber-500"
                                        : "text-sky-400",
                                    )}
                                  >
                                    Margen: {margin! > 0 ? "+" : ""}
                                    {i.unit === "g"
                                      ? `${margin!.toFixed(2)}g`
                                      : `${margin} ud`}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {o.status === "PREPARING"
                      ? `${orderedGrams.toFixed(2)}g pedidos`
                      : `${Number(o.grams).toFixed(2)}g servidos`}{" "}
                    · {paymentLabel[o.paymentMethod]}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  <p className="text-lg font-semibold text-primary">
                    {formatCurrency(o.total)}
                  </p>
                  {o.status === "PREPARING" && (
                    <>
                      <Button size="sm" onClick={() => onMarkReady(o)}>
                        <PackageCheck className="h-4 w-4" /> Marcar listo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => onCancel(o)}
                      >
                        <XCircle className="h-4 w-4" /> Cancelar
                      </Button>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ChefHat className="h-3.5 w-3.5" /> Preparando…
                      </span>
                    </>
                  )}
                  {o.status === "READY" && (
                    <>
                      <Button size="sm" onClick={() => onStatus(o, "COMPLETED")}>
                        <CheckCircle2 className="h-4 w-4" /> Entregado
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => onCancel(o)}
                      >
                        <XCircle className="h-4 w-4" /> Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
