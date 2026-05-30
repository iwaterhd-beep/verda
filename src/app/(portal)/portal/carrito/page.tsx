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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/store/use-cart";
import { currentMember } from "@/lib/current-member";
import { fetchMyMember } from "@/lib/data/members";
import { placeOrderAction } from "@/app/(portal)/portal/actions";
import { getCategoryDisplay } from "@/lib/product-meta";
import { fetchClubCategories } from "@/lib/data/product-categories";
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

  const { data } = useQuery({ queryKey: ["my-member"], queryFn: fetchMyMember });
  const m = data ?? currentMember;
  const cartGrams = grams();
  const remaining = m.consumptionLimit - m.consumedThisMonth;
  const overLimit = cartGrams > remaining;
  const orderTotal = total();
  const insufficientWallet =
    method === "WALLET" && orderTotal > m.walletBalance;

  const { data: categories = [] } = useQuery({
    queryKey: ["club-categories"],
    queryFn: fetchClubCategories,
  });

  async function confirm() {
    if (overLimit) {
      toast.error("No puedes confirmar este pedido", {
        description: "Contacta con el club si necesitas ayuda.",
      });
      return;
    }
    if (insufficientWallet) {
      toast.error("Saldo insuficiente en el monedero", {
        description: `Tu saldo es ${formatCurrency(m.walletBalance)}. Recárgalo o elige otro método.`,
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
        description: `Código de recogida ${res.order!.code}`,
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
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
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${meta.gradient} text-xl`}
                >
                  {meta.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(i.pricePerUnit)}/{i.unit}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => decrement(i.productId)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-5 text-center text-sm font-medium">
                    {i.qty}
                  </span>
                  <Button
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      add({
                        id: i.productId,
                        name: i.name,
                        category: i.category,
                        unit: i.unit,
                        pricePerUnit: i.pricePerUnit,
                        sku: "",
                        stock: 999,
                        lowStockThreshold: 0,
                        batch: "",
                        expiresAt: null,
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => remove(i.productId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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

      {/* Método de pago */}
      <div>
        <p className="mb-2 text-sm font-medium">Método de pago</p>
        <div className="grid grid-cols-3 gap-2">
          {methods.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setMethod(opt.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors",
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
          <p
            className={cn(
              "mt-2 text-xs",
              insufficientWallet ? "text-destructive" : "text-muted-foreground",
            )}
          >
            Saldo del monedero: {formatCurrency(m.walletBalance)}
          </p>
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

      <Button
        size="lg"
        className="w-full"
        disabled={overLimit || insufficientWallet || paying}
        onClick={confirm}
      >
        <ShoppingBag className="h-4 w-4" /> Confirmar pedido
      </Button>
      <p className="pb-2 text-center text-xs text-muted-foreground">
        Recogerás tu pedido presentando tu carnet QR en el club.
      </p>
    </div>
  );
}
