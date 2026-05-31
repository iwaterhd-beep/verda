import { formatCurrency, cn } from "@/lib/utils";
import type { Product } from "@/types";

export function hasProductOffer(
  product: Pick<Product, "pricePerUnit" | "compareAtPrice">,
) {
  return (
    product.compareAtPrice != null &&
    product.compareAtPrice > product.pricePerUnit
  );
}

export function offerDiscountPercent(
  product: Pick<Product, "pricePerUnit" | "compareAtPrice">,
) {
  if (!hasProductOffer(product)) return null;
  const pct = Math.round(
    ((product.compareAtPrice! - product.pricePerUnit) / product.compareAtPrice!) *
      100,
  );
  return pct > 0 ? pct : null;
}

interface ProductPriceProps {
  product: Product;
  className?: string;
  size?: "sm" | "md" | "lg";
  showUnit?: boolean;
}

export function ProductPrice({
  product,
  className,
  size = "sm",
  showUnit = true,
}: ProductPriceProps) {
  const onSale = hasProductOffer(product);
  const unitSuffix =
    showUnit && !product.isPack ? `/${product.unit}` : "";

  const saleClass =
    size === "lg"
      ? "text-2xl font-semibold text-primary"
      : size === "md"
        ? "text-base font-semibold text-primary"
        : "text-sm font-semibold text-primary";

  const compareClass =
    size === "lg"
      ? "text-base text-muted-foreground line-through"
      : "text-xs text-muted-foreground line-through";

  if (!onSale) {
    const normalClass =
      size === "lg"
        ? "text-2xl font-semibold text-primary"
        : size === "md"
          ? "text-base font-medium"
          : "text-sm text-muted-foreground";
    return (
      <span className={cn(normalClass, className)}>
        {formatCurrency(product.pricePerUnit)}
        {unitSuffix}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5",
        className,
      )}
    >
      <span className={compareClass}>
        {formatCurrency(product.compareAtPrice!)}
        {unitSuffix}
      </span>
      <span className={saleClass}>
        {formatCurrency(product.pricePerUnit)}
        {unitSuffix}
      </span>
    </span>
  );
}
