"use client";

import * as React from "react";
import { Loader2, Scale } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { markOrderReadyAction } from "@/app/(dashboard)/pedidos/actions";
import { cn } from "@/lib/utils";
import type { ClubOrder } from "@/types";

function fmtQty(qty: number, unit: string) {
  const n = Number(qty);
  return unit === "g" ? `${n.toFixed(2)}g` : `${n} ud`;
}

function marginText(ordered: number, actual: number, unit: string) {
  const diff = Math.round((actual - ordered) * 100) / 100;
  if (diff === 0) return { label: "0", className: "text-muted-foreground" };
  const sign = diff > 0 ? "+" : "";
  return {
    label: `${sign}${unit === "g" ? diff.toFixed(2) : diff}${unit === "g" ? "g" : " ud"}`,
    className: diff > 0 ? "text-amber-500" : "text-sky-400",
  };
}

interface MarkReadyDialogProps {
  order: ClubOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MarkReadyDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: MarkReadyDialogProps) {
  const [actuals, setActuals] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!order || !open) return;
    const init: Record<string, string> = {};
    for (const item of order.items) {
      const base = item.actualQty ?? item.qty;
      init[item.id] = String(base);
    }
    setActuals(init);
  }, [order, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;

    const lines = order.items.map((item) => ({
      itemId: item.id,
      actualQty: parseFloat(String(actuals[item.id] ?? "").replace(",", ".")),
    }));

    if (lines.some((l) => isNaN(l.actualQty) || l.actualQty <= 0)) {
      toast.error("Introduce un peso real válido en cada línea.");
      return;
    }

    setBusy(true);
    const res = await markOrderReadyAction(order.id, lines);
    setBusy(false);

    if (res.error) {
      toast.error("No se pudo marcar como listo", { description: res.error });
      return;
    }

    toast.success("Pedido listo", {
      description: `${order.code} · stock actualizado`,
    });
    onOpenChange(false);
    onSuccess();
  }

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Peso real servido
            </DialogTitle>
            <DialogDescription>
              Pedido <span className="font-mono">{order.code}</span> ·{" "}
              {order.memberName}. Indica lo que has pesado; se descuenta del
              inventario.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-3">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-1 text-xs font-medium text-muted-foreground">
              <span>Producto</span>
              <span className="w-16 text-right">Pedido</span>
              <span className="w-24 text-center">Real</span>
              <span className="w-16 text-right">Margen</span>
            </div>

            {order.items.map((item) => {
              const actualNum = parseFloat(
                String(actuals[item.id] ?? "").replace(",", "."),
              );
              const ordered = Number(item.qty);
              const margin =
                !isNaN(actualNum) && actualNum > 0
                  ? marginText(ordered, actualNum, item.unit)
                  : null;

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-xl border border-border/60 bg-secondary/20 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.unit}</p>
                  </div>
                  <span className="w-16 text-right text-sm tabular-nums text-muted-foreground">
                    {fmtQty(ordered, item.unit)}
                  </span>
                  <div className="w-24">
                    <Label htmlFor={`actual-${item.id}`} className="sr-only">
                      Real {item.name}
                    </Label>
                    <Input
                      id={`actual-${item.id}`}
                      inputMode="decimal"
                      className="h-9 text-center tabular-nums"
                      value={actuals[item.id] ?? ""}
                      onChange={(e) =>
                        setActuals((s) => ({
                          ...s,
                          [item.id]: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <span
                    className={cn(
                      "w-16 text-right text-sm font-medium tabular-nums",
                      margin?.className ?? "text-muted-foreground",
                    )}
                  >
                    {margin?.label ?? "—"}
                  </span>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar y marcar listo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
