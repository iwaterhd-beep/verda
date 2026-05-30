"use client";

import * as React from "react";
import { Minus, Plus, Bitcoin, Wallet, Banknote, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { products, sales } from "@/lib/mock-data";
import { formatCurrency, cn } from "@/lib/utils";

interface CartLine {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export default function TpvPage() {
  const [cart, setCart] = React.useState<CartLine[]>([]);

  function add(id: string, name: string, price: number) {
    setCart((c) => {
      const found = c.find((l) => l.id === id);
      if (found) return c.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { id, name, price, qty: 1 }];
    });
  }
  function dec(id: string) {
    setCart((c) =>
      c.flatMap((l) =>
        l.id === id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l],
      ),
    );
  }
  const total = cart.reduce((a, l) => a + l.price * l.qty, 0);

  function checkout(method: string) {
    if (!cart.length) return toast.error("El carrito está vacío");
    toast.success("Venta registrada", {
      description: `${formatCurrency(total)} · ${method}`,
    });
    setCart([]);
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="TPV"
        description="Punto de venta rápido, tickets, métodos de pago y estadísticas."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {products.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                No hay productos. Añade inventario en la sección Inventario.
              </div>
            ) : (
              products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => add(p.id, p.name, p.pricePerUnit)}
                  className="group flex flex-col items-start rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-glow active:scale-[0.98]"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Plus className="h-5 w-5" />
                  </span>
                  <p className="mt-3 font-medium leading-tight">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(p.pricePerUnit)}/{p.unit}
                  </p>
                </button>
              ))
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
              {cart.map((l) => (
                <div key={l.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{l.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(l.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => dec(l.id)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-5 text-center text-sm">{l.qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => add(l.id, l.name, l.price)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="w-16 text-right text-sm font-medium">
                    {formatCurrency(l.price * l.qty)}
                  </span>
                </div>
              ))}
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
