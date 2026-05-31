"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/store/use-cart";
import { getCategoryDisplay } from "@/lib/product-meta";
import { fetchClubCategories } from "@/lib/data/product-categories";
import { productHasMedia } from "@/lib/data/product-media";
import {
  formatThcPercent,
  geneticsLabel,
  isCannabisProduct,
  originLabel,
} from "@/lib/product-strain";
import { ProductPrice, hasProductOffer } from "@/lib/product-price";
import { formatPackContents } from "@/lib/product-packs";
import { ProductMediaGallery } from "@/components/portal/product-media-gallery";
import { ProductDetailSheet } from "@/components/portal/product-detail-sheet";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const [detailOpen, setDetailOpen] = React.useState(false);
  const { data: categories = [] } = useQuery({
    queryKey: ["club-categories"],
    queryFn: fetchClubCategories,
  });
  const meta = getCategoryDisplay(product.category, categories);
  const qty = useCart(
    (s) => s.items.find((i) => i.productId === product.id)?.qty ?? 0,
  );
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);
  const soldOut = product.stock <= 0;
  const hasMedia = productHasMedia(product);
  const showStrain = !product.isPack && isCannabisProduct(product.category, categories);
  const packContents = product.isPack ? formatPackContents(product.packItems) : "";
  const thc = formatThcPercent(product.thcPercent);
  const genetics = geneticsLabel(product.genetics);
  const origin = originLabel(product.origin);

  function openDetail() {
    setDetailOpen(true);
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {hasMedia && (
          <button
            type="button"
            onClick={openDetail}
            className="block w-full touch-manipulation text-left active:opacity-95"
            aria-label={`Ver detalle de ${product.name}`}
          >
            <ProductMediaGallery product={product} />
          </button>
        )}

        <div className="p-3">
          <button
            type="button"
            onClick={openDetail}
            className="flex w-full touch-manipulation items-start gap-3 text-left active:opacity-95"
            aria-label={`Ver detalle de ${product.name}`}
          >
            {!hasMedia && (
              <span
                className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${meta.gradient} text-2xl`}
              >
                {meta.emoji}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{product.name}</p>
                {product.isPack && (
                  <Badge variant="secondary" className="h-5 shrink-0 text-[10px]">
                    Pack
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ProductPrice product={product} size="sm" />
                {hasProductOffer(product) && (
                  <Badge className="h-5 shrink-0 bg-primary/15 text-[10px] text-primary hover:bg-primary/15">
                    Oferta
                  </Badge>
                )}
              </div>
              {product.isPack && packContents && (
                <p className="mt-1 text-xs text-muted-foreground">{packContents}</p>
              )}
              {showStrain && (thc || genetics || origin) && (
                <div className="mt-1.5 flex flex-wrap gap-1">
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
              {showStrain && (product.grower || product.extractor) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {[product.grower, product.extractor].filter(Boolean).join(" · ")}
                </p>
              )}
              {showStrain && product.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {product.description}
                </p>
              )}
              {soldOut && <p className="mt-1 text-xs text-destructive">Agotado</p>}
            </div>
          </button>

          <div className="mt-3 flex items-center justify-end border-t border-border/50 pt-3">
            {qty === 0 ? (
              <Button
                variant="secondary"
                disabled={soldOut}
                className="min-h-11 w-full touch-manipulation sm:w-auto"
                onClick={() => {
                  add(product);
                  toast.success("Añadido al pedido", { description: product.name });
                }}
              >
                <Plus className="h-4 w-4" /> Añadir
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  className="touch-target h-11 w-11"
                  aria-label="Quitar uno"
                  onClick={() => decrement(product.id)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-8 text-center text-base font-semibold">{qty}</span>
                <Button
                  size="icon"
                  className="touch-target h-11 w-11"
                  disabled={qty >= product.stock}
                  aria-label="Añadir uno"
                  onClick={() => add(product)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductDetailSheet
        product={product}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
