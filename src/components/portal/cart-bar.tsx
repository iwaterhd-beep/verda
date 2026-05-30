"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/store/use-cart";
import { formatCurrency } from "@/lib/utils";

export function CartBar() {
  const count = useCart((s) => s.count());
  const total = useCart((s) => s.total());

  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-[60px] z-30 px-4">
      <Link
        href="/portal/carrito"
        className="mx-auto flex max-w-md items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
      >
        <span className="flex items-center gap-2 font-medium">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-foreground/15">
            <ShoppingBag className="h-4 w-4" />
          </span>
          Ver pedido · {count}
        </span>
        <span className="font-semibold">{formatCurrency(total)}</span>
      </Link>
    </div>
  );
}
