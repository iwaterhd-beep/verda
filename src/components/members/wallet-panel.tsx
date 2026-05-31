"use client";

import * as React from "react";
import {
  Wallet,
  Plus,
  Minus,
  Pencil,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { fetchMember, fetchWalletMovements, adjustWallet } from "@/lib/data/members";
import { formatCurrency, formatDate, cn, walletBalanceTone } from "@/lib/utils";
import type { WalletMovementType } from "@/types";

type Mode = "TOPUP" | "WITHDRAW" | "ADJUST";

const movementMeta: Record<
  WalletMovementType,
  { label: string; icon: React.ElementType }
> = {
  TOPUP: { label: "Recarga", icon: ArrowUpRight },
  WITHDRAW: { label: "Retirada", icon: ArrowDownRight },
  ADJUST: { label: "Ajuste manual", icon: SlidersHorizontal },
  PURCHASE: { label: "Compra", icon: ShoppingBag },
};

export function WalletPanel({ memberId }: { memberId: string }) {
  const queryClient = useQueryClient();
  const { data: member } = useQuery({
    queryKey: ["member", memberId],
    queryFn: () => fetchMember(memberId),
  });
  const { data: movements = [] } = useQuery({
    queryKey: ["wallet", memberId],
    queryFn: () => fetchWalletMovements(memberId),
  });

  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("TOPUP");
  const [value, setValue] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const balance = member?.walletBalance ?? 0;

  async function submit() {
    const num = parseFloat(value.replace(",", "."));
    if (Number.isNaN(num)) {
      toast.error("Introduce un importe válido");
      return;
    }
    let amount = 0;
    let type: WalletMovementType = "TOPUP";
    if (mode === "TOPUP") {
      if (num <= 0) {
        toast.error("La recarga debe ser mayor que 0");
        return;
      }
      amount = num;
      type = "TOPUP";
    } else if (mode === "WITHDRAW") {
      if (num <= 0) {
        toast.error("La retirada debe ser mayor que 0");
        return;
      }
      amount = -num;
      type = "WITHDRAW";
    } else {
      amount = Math.round((num - balance) * 100) / 100;
      type = "ADJUST";
    }
    setSaving(true);
    try {
      await adjustWallet(memberId, amount, type);
      queryClient.invalidateQueries({ queryKey: ["member", memberId] });
      queryClient.invalidateQueries({ queryKey: ["wallet", memberId] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Cartera actualizada", {
        description:
          mode === "ADJUST"
            ? `Saldo fijado en ${formatCurrency(num)}`
            : `${amount >= 0 ? "+" : ""}${formatCurrency(amount)}`,
      });
      setOpen(false);
      setValue("");
    } catch (e) {
      toast.error("No se pudo actualizar la cartera", {
        description: (e as Error).message,
      });
    } finally {
      setSaving(false);
    }
  }

  function openWith(m: Mode) {
    setMode(m);
    setValue("");
    setOpen(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cartera / monedero</CardTitle>
        <CardDescription>
          Saldo disponible y movimientos. Puede quedar en negativo si el club lo
          permite.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Saldo actual</p>
              <p className={cn("text-2xl font-semibold tracking-tight", walletBalanceTone(balance))}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="secondary" onClick={() => openWith("TOPUP")}>
            <Plus className="h-4 w-4" /> Recargar
          </Button>
          <Button variant="secondary" onClick={() => openWith("WITHDRAW")}>
            <Minus className="h-4 w-4" /> Retirar
          </Button>
          <Button variant="secondary" onClick={() => openWith("ADJUST")}>
            <Pencil className="h-4 w-4" /> Ajustar
          </Button>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Movimientos</p>
          {movements.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
              Sin movimientos todavía.
            </p>
          ) : (
            <div className="space-y-2">
              {movements.map((mv) => {
                const meta = movementMeta[mv.type];
                const positive = mv.amount >= 0;
                return (
                  <div
                    key={mv.id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 p-3"
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-lg",
                        positive
                          ? "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]"
                          : "bg-destructive/15 text-destructive",
                      )}
                    >
                      <meta.icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(mv.createdAt, true)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          positive
                            ? "text-[hsl(var(--success))]"
                            : "text-destructive",
                        )}
                      >
                        {positive ? "+" : ""}
                        {formatCurrency(mv.amount)}
                      </p>
                      <p className={cn("text-xs text-muted-foreground", walletBalanceTone(mv.balanceAfter))}>
                        {formatCurrency(mv.balanceAfter)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {mode === "TOPUP"
                ? "Recargar cartera"
                : mode === "WITHDRAW"
                  ? "Retirar saldo"
                  : "Ajustar saldo"}
            </DialogTitle>
            <DialogDescription>
              {mode === "ADJUST"
                ? `Fija un nuevo saldo absoluto (puede ser negativo). Saldo actual: ${formatCurrency(balance)}.`
                : `Saldo actual: ${formatCurrency(balance)}. Las retiradas pueden dejar saldo negativo.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="amount">
              {mode === "ADJUST" ? "Nuevo saldo (Crd)" : "Importe (Crd)"}
            </Label>
            <Input
              id="amount"
              inputMode="decimal"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={mode === "ADJUST" ? "-10,00" : "0,00"}
            />
            {mode === "TOPUP" && (
              <div className="mt-1 flex gap-2">
                {[10, 20, 50].map((q) => (
                  <Button
                    key={q}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue(String(q))}
                  >
                    +{q} Crd
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
