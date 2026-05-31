"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { formatDate } from "@/lib/utils";
import { ProductPrice, hasProductOffer, offerDiscountPercent } from "@/lib/product-price";
import { ProductMediaGallery } from "@/components/portal/product-media-gallery";
import type { Product } from "@/types";

interface ProductDetailSheetProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailSheet({
  product,
  open,
  onOpenChange,
}: ProductDetailSheetProps) {
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
  const thc = formatThcPercent(product.thcPercent);
  const genetics = geneticsLabel(product.genetics);
  const origin = originLabel(product.origin);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="portal-dialog flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border/50 px-4 py-3 text-left">
          <div className="flex items-start gap-2 pr-8">
            {!hasMedia && (
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${meta.gradient} text-lg`}
              >
                {meta.emoji}
              </span>
            )}
            <div className="min-w-0">
              <DialogTitle className="text-lg leading-tight">{product.name}</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {meta.emoji} {meta.label}
                {product.isPack && (
                  <Badge variant="secondary" className="ml-2 h-5 text-[10px]">
                    Pack
                  </Badge>
                )}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {hasMedia ? (
            <ProductMediaGallery product={product} variant="detail" />
          ) : (
            <div
              className={`grid aspect-[4/3] place-items-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-6xl`}
            >
              {meta.emoji}
            </div>
          )}

          <div className="mt-4 space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <ProductPrice product={product} size="lg" />
                {hasProductOffer(product) && offerDiscountPercent(product) != null && (
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                    -{offerDiscountPercent(product)}%
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Stock: {soldOut ? "Agotado" : `${product.stock} ${product.unit}`}
              </p>
            </div>

            {product.isPack && (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Contenido del pack
                  </p>
                  {product.packItems?.length ? (
                    <ul className="space-y-2">
                      {product.packItems.map((item, index) => (
                        <li
                          key={`${item.productId}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-secondary/20 px-3 py-2.5 text-sm"
                        >
                          <span className="min-w-0 truncate font-medium">
                            {item.productName?.trim() || "Producto"}
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {item.unit === "g"
                              ? `${Number(item.qty) % 1 === 0 ? item.qty : item.qty.toFixed(2)}g`
                              : `${item.qty} ud`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Este pack no tiene componentes publicados.
                    </p>
                  )}
                </div>
              </>
            )}

            {showStrain && (thc || genetics || origin) && (
              <div className="flex flex-wrap gap-1.5">
                {thc && <Badge variant="outline">{thc}</Badge>}
                {genetics && <Badge variant="outline">{genetics}</Badge>}
                {origin && <Badge variant="outline">{origin}</Badge>}
              </div>
            )}

            {showStrain && (product.grower || product.extractor) && (
              <p className="text-sm text-muted-foreground">
                {[product.grower, product.extractor].filter(Boolean).join(" · ")}
              </p>
            )}

            {product.description && (
              <>
                <Separator />
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Descripción
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </>
            )}

            {(product.batch || product.expiresAt) && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {product.batch && (
                    <div>
                      <p className="text-xs text-muted-foreground">Lote</p>
                      <p className="font-medium">{product.batch}</p>
                    </div>
                  )}
                  {product.expiresAt && (
                    <div>
                      <p className="text-xs text-muted-foreground">Caducidad</p>
                      <p className="font-medium">{formatDate(product.expiresAt)}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-border/50 bg-background/95 px-4 py-3 backdrop-blur-md">
          {soldOut ? (
            <p className="text-center text-sm text-destructive">Producto agotado</p>
          ) : qty === 0 ? (
            <Button
              className="min-h-12 w-full touch-manipulation text-base"
              onClick={() => {
                add(product);
                toast.success("Añadido al pedido", { description: product.name });
                onOpenChange(false);
              }}
            >
              <Plus className="h-4 w-4" /> Añadir al pedido
            </Button>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">En tu pedido</span>
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
                <span className="min-w-8 text-center text-lg font-semibold">{qty}</span>
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
