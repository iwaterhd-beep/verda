"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/store/use-cart";
import {
  formatThcPercent,
  geneticsLabel,
  originLabel,
} from "@/lib/product-strain";
import { ProductPrice } from "@/lib/product-price";
import { ProductMediaGallery } from "@/components/portal/product-media-gallery";
import { ProductDetailSheet } from "@/components/portal/product-detail-sheet";
import {
  jarItemToProductPreview,
} from "@/lib/data/product-jars";
import { catalogEntryHasMedia } from "@/lib/catalog-media";
import type { JarItem, Product, ProductJar } from "@/types";

interface JarItemCardProps {
  item: JarItem;
  jarName: string;
  jar?: ProductJar | null;
  product?: Product | null;
}

export function JarItemCard({
  item,
  jarName,
  jar,
  product,
}: JarItemCardProps) {
  const [detailOpen, setDetailOpen] = React.useState(false);
  const preview = jarItemToProductPreview(item, product, jar);
  const hasMedia = catalogEntryHasMedia(item, jar, product);
  const soldOut = (item.stock ?? 0) <= 0 || !product;
  const cartProductId = product?.id;

  const qty = useCart(
    (s) =>
      cartProductId
        ? (s.items.find((i) => i.productId === cartProductId)?.qty ?? 0)
        : 0,
  );
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);

  const thc = formatThcPercent(item.thcPercent);
  const genetics = geneticsLabel(item.genetics);
  const origin = originLabel(item.origin);

  function handleAdd() {
    if (!product) {
      toast.error("Sin stock en inventario", {
        description: "El staff debe vincular esta ítem a un producto.",
      });
      return;
    }
    if (product.stock <= 0) {
      toast.error("Agotado");
      return;
    }
    add(product);
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {hasMedia && (
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="block w-full touch-manipulation text-left active:opacity-95"
            aria-label={`Ver detalle de ${item.name}`}
          >
            <ProductMediaGallery product={preview} />
          </button>
        )}

        <div className="p-3">
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            className="flex w-full touch-manipulation items-start gap-3 text-left active:opacity-95"
            aria-label={`Ver detalle de ${item.name}`}
          >
            {!hasMedia && (
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-2xl">
                🫙
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold leading-tight">{item.name}</p>
                <Badge variant="secondary" className="h-5 text-[10px]">
                  {jarName}
                </Badge>
              </div>
              {(thc || genetics || origin) && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {thc && (
                    <Badge variant="outline" className="h-5 text-[10px]">
                      {thc}
                    </Badge>
                  )}
                  {genetics && (
                    <Badge variant="outline" className="h-5 text-[10px]">
                      {genetics}
                    </Badge>
                  )}
                  {origin && (
                    <Badge variant="outline" className="h-5 text-[10px]">
                      {origin}
                    </Badge>
                  )}
                </div>
              )}
              <div className="mt-2">
                <ProductPrice product={preview} size="sm" />
              </div>
              {soldOut ? (
                <p className="mt-1 text-xs text-muted-foreground">Agotado</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Stock: {item.stock?.toFixed(2)}g
                </p>
              )}
            </div>
          </button>

          <div className="mt-3 flex items-center justify-end gap-2">
            {qty > 0 ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => cartProductId && decrement(cartProductId)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center text-sm font-medium tabular-nums">
                  {qty}
                </span>
                <Button
                  size="icon"
                  className="h-9 w-9"
                  disabled={soldOut}
                  onClick={handleAdd}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="min-h-10 px-4"
                disabled={soldOut}
                onClick={handleAdd}
              >
                Añadir
              </Button>
            )}
          </div>
        </div>
      </div>

      <ProductDetailSheet
        product={preview}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
