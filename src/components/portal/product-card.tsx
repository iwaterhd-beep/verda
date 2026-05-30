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
  const hasMedia = Boolean(product.videoUrl || product.photos?.length);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {hasMedia && (
        <div className="relative aspect-[16/9] w-full bg-secondary">
          {product.videoUrl ? (
            <video
              src={product.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.photos![0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      )}

      <div className="flex items-center gap-3 p-3">
        {!hasMedia && (
          <span
            className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${meta.gradient} text-2xl`}
          >
            {meta.emoji}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{product.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(product.pricePerUnit)}/{product.unit}
          </p>
          {soldOut && <p className="text-xs text-destructive">Agotado</p>}
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

      {product.photos && product.photos.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto border-t border-border/60 px-3 py-2">
          {product.photos.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`${product.name} ${i + 1}`}
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
