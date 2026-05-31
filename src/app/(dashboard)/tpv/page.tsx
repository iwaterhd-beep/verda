"use client";

import * as React from "react";
import { Minus, Plus, Bitcoin, Wallet, Banknote, Trash2, Receipt, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { sales } from "@/lib/mock-data";
import { fetchClubProducts } from "@/lib/data/products";
import { ProductPrice } from "@/lib/product-price";
import { formatCurrency, cn } from "@/lib/utils";
import {
  TpvCartLine,
  tpvLineStockQty,
  type TpvCartLineData,
} from "@/components/tpv/tpv-cart-line";
import type { Product } from "@/types";

export default function TpvPage() {
  const [cart, setCart] = React.useState<TpvCartLineData[]>([]);
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["club-products"],
    queryFn: fetchClubProducts,
  });

  function add(product: Product) {
    if (product.stock <= 0) {
      toast.error("Sin stock");
      return;
    }
    setCart((c) => {
      const found = c.find((l) => l.id === product.id);
      if (found) {
        if (product.unit === "g") return c;
        return c.map((l) =>
          l.id === product.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [
        ...c,
        {
          id: product.id,
          name: product.name,
          price: product.pricePerUnit,
          qty: product.unit === "g" ? 0 : 1,
          unit: product.unit,
        },
      ];
    });
  }

  function setLineQty(id: string, qty: number) {
    setCart((c) =>
      c.map((l) => {
        if (l.id !== id) return l;
        const prevQty = l.qty;
        const syncedActual =
          l.actualQty == null || l.actualQty === prevQty ? qty : l.actualQty;
        return { ...l, qty, actualQty: syncedActual };
      }),
    );
  }

  function setLineActualQty(id: string, actualQty: number) {
    setCart((c) =>
      c.map((l) => (l.id === id ? { ...l, actualQty } : l)),
    );
  }

  function dec(id: string) {
    setCart((c) =>
      c.flatMap((l) =>
        l.id === id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l],
      ),
    );
  }

  function removeLine(id: string) {
    setCart((c) => c.filter((l) => l.id !== id));
  }

  const activeCart = cart.filter((l) => l.qty > 0);
  const total = activeCart.reduce((a, l) => a + l.price * l.qty, 0);

  function checkout(method: string) {
    if (!activeCart.length) return toast.error("El carrito está vacío");

    for (const line of activeCart) {
      const product = products.find((p) => p.id === line.id);
      if (!product) continue;
      const stockQty = tpvLineStockQty(line);
      if (stockQty > product.stock) {
        toast.error(`Stock insuficiente para ${line.name}`, {
          description: `Disponible: ${product.stock.toFixed(2)}g · servido: ${stockQty.toFixed(2)}g`,
        });
        return;
      }
    }

    toast.success("Venta registrada", {
      description: `${formatCurrency(total)} · ${method}`,
    });
    setCart([]);
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="TPV"
        description="Punto de venta rápido. Incluye productos ocultos al portal de socios."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                No hay productos. Añade inventario en la sección Inventario.
              </div>
            ) : (
              products.map((p) => {
                const soldOut = p.stock <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={soldOut}
                    onClick={() => add(p)}
                    className={cn(
                      "group flex flex-col items-start rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-glow active:scale-[0.98]",
                      soldOut && "cursor-not-allowed opacity-50 hover:border-border hover:shadow-none",
                    )}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                      <Plus className="h-5 w-5" />
                    </span>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <p className="font-medium leading-tight">{p.name}</p>
                      {p.hiddenFromMembers && (
                        <Badge variant="secondary" className="h-5 text-[10px]">
                          Oculto
                        </Badge>
                      )}
                    </div>
                    <ProductPrice product={p} size="sm" />
                    {soldOut ? (
                      <p className="text-xs text-muted-foreground">Agotado</p>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Últimos tickets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sales.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Sin ventas registradas.
                </p>
              ) : (
                sales.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 p-3"
                  >
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {s.ticket} · {s.memberName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.items} artículos · {s.paymentMethod}
                      </p>
                    </div>
                    {s.status === "REFUNDED" ? (
                      <Badge variant="destructive">Devuelto</Badge>
                    ) : (
                      <span className="font-medium">{formatCurrency(s.total)}</span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-glow flex h-fit flex-col lg:sticky lg:top-20">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Ticket actual</CardTitle>
            {cart.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => setCart([])}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="min-h-[120px] space-y-2">
              {cart.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Selecciona productos para empezar.
                </p>
              )}
              {cart.map((l) => {
                const product = products.find((p) => p.id === l.id);
                return (
                  <TpvCartLine
                    key={l.id}
                    line={l}
                    maxQty={product?.stock}
                    onQtyChange={setLineQty}
                    onActualQtyChange={setLineActualQty}
                    onRemove={removeLine}
                    onDecrement={dec}
                    onIncrement={(id) => {
                      const p = products.find((x) => x.id === id);
                      if (p) add(p);
                    }}
                  />
                );
              })}
            </div>

            <Separator className="my-4" />
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span className={cn(total > 0 && "text-primary")}>
                {formatCurrency(total)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <PayButton icon={Wallet} label="Monedero" onClick={() => checkout("Monedero")} />
              <PayButton icon={Banknote} label="Efectivo" onClick={() => checkout("Efectivo")} />
              <PayButton icon={Bitcoin} label="Cripto" onClick={() => checkout("Cripto")} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PayButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="secondary"
      className="flex h-auto flex-col gap-1 py-3"
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs">{label}</span>
    </Button>
  );
}
