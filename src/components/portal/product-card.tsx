"use client";

import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/use-cart";
import { categoryMeta } from "@/lib/product-meta";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const meta = categoryMeta[product.category];
  const qty = useCart(
    (s) => s.items.find((i) => i.productId === product.id)?.qty ?? 0,
  );
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);
  const soldOut = product.stock <= 0;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <span
        className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${meta.gradient} text-2xl`}
      >
        {meta.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(product.pricePerUnit)}/{product.unit}
        </p>
        {soldOut && (
          <p className="text-xs text-destructive">Agotado</p>
        )}
      </div>

      {qty === 0 ? (
        <Button
          size="sm"
          variant="secondary"
          disabled={soldOut}
          onClick={() => {
            add(product);
            toast.success("Añadido al pedido", { description: product.name });
          }}
        >
          <Plus className="h-4 w-4" /> Añadir
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => decrement(product.id)}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="w-5 text-center text-sm font-medium">{qty}</span>
          <Button
            size="icon"
            className="h-8 w-8"
            disabled={qty >= product.stock}
            onClick={() => add(product)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
