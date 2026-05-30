import type { ProductCategory } from "@/types";
import {
  DEFAULT_PRODUCT_CATEGORIES,
  getCategoryDisplay,
} from "@/lib/product-categories";

/** @deprecated Usa getCategoryDisplay con categorías del club. */
export const categoryMeta = Object.fromEntries(
  DEFAULT_PRODUCT_CATEGORIES.map((c) => {
    const display = getCategoryDisplay(c.id);
    return [
      c.id,
      {
        label: display.label,
        formLabel: display.formLabel,
        emoji: display.emoji,
        gradient: display.gradient,
      },
    ];
  }),
) as Record<
  string,
  { label: string; formLabel: string; emoji: string; gradient: string }
>;

/** @deprecated Usa categorías del club ordenadas por sortOrder. */
export const categoryOrder = DEFAULT_PRODUCT_CATEGORIES.map((c) => c.id);

export function productCategoriesFromList(categories: ProductCategory[]) {
  return [...categories]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
    .map((c) => ({ value: c.id, label: c.label }));
}

export {
  DEFAULT_PRODUCT_CATEGORIES,
  getCategoryDisplay,
  isCannabisCategory,
} from "@/lib/product-categories";

export const unitOptions: {
  value: "g" | "ud";
  label: string;
  priceLabel: string;
  stockLabel: string;
  stockStep: string;
}[] = [
  {
    value: "g",
    label: "Gramos",
    priceLabel: "Precio por gramo (Crd)",
    stockLabel: "Stock (gramos)",
    stockStep: "0.01",
  },
  {
    value: "ud",
    label: "Unidades",
    priceLabel: "Precio por unidad (Crd)",
    stockLabel: "Stock (unidades)",
    stockStep: "1",
  },
];

export function unitMeta(unit: "g" | "ud") {
  return unitOptions.find((o) => o.value === unit) ?? unitOptions[0];
}
