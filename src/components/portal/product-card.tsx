"use client";

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
import { formatCurrency } from "@/lib/utils";
import { ProductMediaGallery } from "@/components/portal/product-media-gallery";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
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
  const showStrain = isCannabisProduct(product.category, categories);
  const thc = formatThcPercent(product.thcPercent);
  const genetics = geneticsLabel(product.genetics);
  const origin = originLabel(product.origin);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {hasMedia && <ProductMediaGallery product={product} />}

      <div className="flex items-start gap-3 p-3">
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

        {qty === 0 ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={soldOut}
            className="shrink-0"
            onClick={() => {
              add(product);
              toast.success("Añadido al pedido", { description: product.name });
            }}
          >
            <Plus className="h-4 w-4" /> Añadir
          </Button>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
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
    </div>
  );
}
