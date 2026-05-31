"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Wallet,
  Banknote,
  Bitcoin,
  AlertTriangle,
  ShoppingBag,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCart, productFromCartItem } from "@/store/use-cart";
import { formatPackContents } from "@/lib/product-packs";
import { currentMember } from "@/lib/current-member";
import { fetchMyMember } from "@/lib/data/members";
import { placeOrderAction } from "@/app/(portal)/portal/actions";
import { getCategoryDisplay } from "@/lib/product-meta";
import { CategoryIconBackdrop } from "@/components/category-icon-backdrop";
import { fetchClubCategories } from "@/lib/data/product-categories";
import { fetchClubPaymentSettings } from "@/lib/data/club-settings";
import { cryptoNetworkLabel } from "@/lib/club-crypto";
import { formatCurrency, cn } from "@/lib/utils";
import type { Order } from "@/types";

const methods: { id: Order["paymentMethod"]; label: string; icon: React.ElementType }[] = [
  { id: "WALLET", label: "Monedero", icon: Wallet },
  { id: "CASH", label: "Efectivo", icon: Banknote },
  { id: "CRYPTO", label: "Cripto", icon: Bitcoin },
];

export default function CartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { items, add, decrement, remove, total, grams, clear } = useCart();
  const [method, setMethod] = React.useState<Order["paymentMethod"]>("WALLET");
  const [paying, setPaying] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const { data } = useQuery({ queryKey: ["my-member"], queryFn: fetchMyMember });
  const m = data ?? currentMember;
  const cartGrams = grams();
  const remaining = m.consumptionLimit - m.consumedThisMonth;
  const overLimit = cartGrams > remaining;
  const orderTotal = total();
  const walletAfterOrder = m.walletBalance - orderTotal;
  const walletWillGoNegative = method === "WALLET" && walletAfterOrder < 0;

  const { data: categories = [] } = useQuery({
    queryKey: ["club-categories"],
    queryFn: fetchClubCategories,
  });

  const { data: paymentSettings } = useQuery({
    queryKey: ["club-payment-settings"],
    queryFn: fetchClubPaymentSettings,
  });

  const cryptoWallet = paymentSettings?.cryptoWalletAddress ?? null;
  const cryptoNetwork = paymentSettings?.cryptoWalletNetwork ?? null;

  async function copyCryptoAddress() {
    if (!cryptoWallet) return;
    try {
      await navigator.clipboard.writeText(cryptoWallet);
      setCopied(true);
      toast.success("Dirección copiada");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar la dirección");
    }
  }

  async function confirm() {
    if (overLimit) {
      toast.error("No puedes confirmar este pedido", {
        description: "Contacta con el club si necesitas ayuda.",
      });
      return;
    }

    setPaying(true);
    try {
      const res = await placeOrderAction(items, method);
      if (res.error) {
        toast.error("No se pudo confirmar el pedido", { description: res.error });
        return;
      }
      clear();
      queryClient.invalidateQueries({ queryKey: ["my-member"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success("¡Pedido confirmado!", {
        description:
          method === "WALLET" && walletAfterOrder < 0
            ? `Código ${res.order!.code}. Tu monedero queda en ${formatCurrency(walletAfterOrder)}.`
            : `Código de recogida ${res.order!.code}`,
      });
      router.push("/portal/pedidos");
    } finally {
      setPaying(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-3xl">
          🛍️
        </span>
        <p className="mt-4 font-medium">Tu pedido está vacío</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Añade productos desde el menú.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/portal/menu">Ver menú</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="touch-target" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Tu pedido</h1>
      </div>

      <div className="space-y-2">
        {items.map((i) => {
          const meta = getCategoryDisplay(i.category, categories);
          return (
            <Card key={i.productId}>
              <CardContent className="flex items-center gap-3 p-3">
                <CategoryIconBackdrop display={meta} className="h-12 w-12 shrink-0 text-xl">
                  {meta.emoji}
                </CategoryIconBackdrop>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {i.unit === "pack"
                      ? formatCurrency(i.pricePerUnit)
                      : `${formatCurrency(i.pricePerUnit)}/${i.unit}`}
                  </p>
                  {i.unit === "pack" && i.packItems?.length ? (
                    <p className="text-xs text-muted-foreground">
                      {formatPackContents(i.packItems)}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="touch-target h-11 w-11"
                    aria-label="Quitar uno"
                    onClick={() => decrement(i.productId)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="min-w-8 text-center text-base font-semibold">
                    {i.qty}
                  </span>
                  <Button
                    size="icon"
                    className="touch-target h-11 w-11"
                    aria-label="Añadir uno"
                    onClick={() => add(productFromCartItem(i))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="touch-target h-11 w-11 text-muted-foreground"
                    aria-label="Eliminar del pedido"
                    onClick={() => remove(i.productId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {overLimit && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            No puedes confirmar este pedido. Contacta con el club.
          </span>
        </div>
      )}

      {walletWillGoNegative && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
          <span className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Tu monedero quedará en{" "}
            <strong>{formatCurrency(walletAfterOrder)}</strong>. El club permite
            saldo negativo; recarga cuando puedas.
          </span>
        </div>
      )}

      {/* Método de pago */}
      <div>
        <p className="mb-2 text-sm font-medium">Método de pago</p>
        <div className="grid grid-cols-3 gap-2">
          {methods.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMethod(opt.id)}
              className={cn(
                "flex min-h-[4.5rem] touch-manipulation flex-col items-center justify-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors active:scale-[0.98]",
                method === opt.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              <opt.icon className="h-5 w-5" />
              {opt.label}
            </button>
          ))}
        </div>
        {method === "WALLET" && (
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p className={cn(m.walletBalance < 0 && "text-destructive")}>
              Saldo actual: {formatCurrency(m.walletBalance)}
            </p>
            {walletWillGoNegative && (
              <p className="text-amber-900 dark:text-amber-200">
                Tras el pedido: {formatCurrency(walletAfterOrder)}
              </p>
            )}
          </div>
        )}
        {method === "CRYPTO" && (
          <div className="mt-3 space-y-2">
            {cryptoWallet ? (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs font-medium text-primary">
                  Envía {formatCurrency(orderTotal)} a esta cartera
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Red: {cryptoNetworkLabel(cryptoNetwork)}
                </p>
                <div className="mt-2 flex items-start gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-lg bg-background px-2 py-1.5 font-mono text-xs">
                    {cryptoWallet}
                  </code>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="shrink-0"
                    aria-label="Copiar dirección"
                    onClick={() => void copyCryptoAddress()}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Confirma el pedido y realiza la transferencia. El club verificará
                  el pago al recoger.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                El club aún no ha configurado una cartera cripto. Puedes confirmar
                el pedido y pagar en el club.
              </div>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(total())}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Recogida en el club</span>
            <span>Gratis</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total())}</span>
          </div>
        </CardContent>
      </Card>

      <div className="portal-sticky-footer space-y-3">
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Total a pagar</span>
          <span className="text-primary">{formatCurrency(total())}</span>
        </div>
        <Button
          size="lg"
          className="min-h-12 w-full touch-manipulation text-base"
          disabled={overLimit || paying}
          onClick={confirm}
        >
          <ShoppingBag className="h-4 w-4" /> Confirmar pedido
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Recogerás tu pedido presentando tu carnet QR en el club.
        </p>
      </div>
    </div>
  );
}
