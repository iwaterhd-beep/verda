import type { Product } from "@/types";

export const categoryMeta: Record<
  Product["category"],
  { label: string; formLabel: string; emoji: string; gradient: string }
> = {
  FLOR: { label: "Flores", formLabel: "Flor", emoji: "🌿", gradient: "from-emerald-500/25 to-green-700/10" },
  HASH: { label: "Hash", formLabel: "Hash", emoji: "🧱", gradient: "from-stone-500/25 to-amber-900/10" },
  EXTRACTO: { label: "Extractos", formLabel: "Extracto", emoji: "🍯", gradient: "from-amber-500/25 to-orange-700/10" },
  COMESTIBLE: { label: "Comestibles", formLabel: "Comestible", emoji: "🍬", gradient: "from-pink-500/25 to-rose-700/10" },
  MERCH: { label: "Merch", formLabel: "Merch", emoji: "👕", gradient: "from-sky-500/25 to-blue-700/10" },
  OTRO: { label: "Otros", formLabel: "Otro", emoji: "✨", gradient: "from-violet-500/25 to-purple-700/10" },
};

export const categoryOrder: Product["category"][] = [
  "FLOR",
  "HASH",
  "EXTRACTO",
  "COMESTIBLE",
  "MERCH",
  "OTRO",
];

export const productCategories = categoryOrder.map((value) => ({
  value,
  label: categoryMeta[value].formLabel,
}));

export function categoryLabel(category: Product["category"]) {
  return categoryMeta[category]?.label ?? category;
}

export const unitOptions: {
  value: Product["unit"];
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

export function unitMeta(unit: Product["unit"]) {
  return unitOptions.find((o) => o.value === unit) ?? unitOptions[0];
}
