import type { ProductCategory } from "@/types";

export const DEFAULT_PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: "FLOR", label: "Flor", emoji: "🌿", sortOrder: 0, isCannabis: true },
  { id: "HASH", label: "Hash", emoji: "🧱", sortOrder: 1, isCannabis: true },
  { id: "EXTRACTO", label: "Extracto", emoji: "🍯", sortOrder: 2, isCannabis: true },
  { id: "COMESTIBLE", label: "Comestible", emoji: "🍬", sortOrder: 3, isCannabis: false },
  { id: "MERCH", label: "Merch", emoji: "👕", sortOrder: 4, isCannabis: false },
  { id: "OTRO", label: "Otro", emoji: "✨", sortOrder: 5, isCannabis: false },
];

const CATEGORY_GRADIENTS: Record<string, string> = {
  FLOR: "from-emerald-500/25 to-green-700/10",
  HASH: "from-stone-500/25 to-amber-900/10",
  EXTRACTO: "from-amber-500/25 to-orange-700/10",
  COMESTIBLE: "from-pink-500/25 to-rose-700/10",
  MERCH: "from-sky-500/25 to-blue-700/10",
  OTRO: "from-violet-500/25 to-purple-700/10",
};

const FALLBACK_GRADIENTS = [
  "from-teal-500/25 to-cyan-700/10",
  "from-indigo-500/25 to-blue-700/10",
  "from-rose-500/25 to-red-700/10",
  "from-lime-500/25 to-green-700/10",
  "from-fuchsia-500/25 to-purple-700/10",
];

export type CategoryDisplay = {
  label: string;
  formLabel: string;
  emoji: string;
  gradient: string;
  isCannabis: boolean;
};

export function categoryIdFromLabel(label: string) {
  const base = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 32);
  return base || "CATEGORIA";
}

function gradientForId(id: string) {
  if (CATEGORY_GRADIENTS[id]) return CATEGORY_GRADIENTS[id];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1)) % 997;
  return FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length];
}

export function getCategoryDisplay(
  id: string,
  categories: ProductCategory[] = DEFAULT_PRODUCT_CATEGORIES,
): CategoryDisplay {
  const cat =
    categories.find((c) => c.id === id) ??
    DEFAULT_PRODUCT_CATEGORIES.find((c) => c.id === id);

  if (!cat) {
    return {
      label: id,
      formLabel: id,
      emoji: "✨",
      gradient: gradientForId(id),
      isCannabis: false,
    };
  }

  return {
    label: cat.label,
    formLabel: cat.label,
    emoji: cat.emoji,
    gradient: gradientForId(cat.id),
    isCannabis: cat.isCannabis,
  };
}

export function isCannabisCategory(
  categoryId: string,
  categories?: ProductCategory[],
) {
  const list = categories?.length ? categories : DEFAULT_PRODUCT_CATEGORIES;
  const cat = list.find((c) => c.id === categoryId);
  if (cat) return cat.isCannabis;
  return categoryId === "FLOR" || categoryId === "HASH" || categoryId === "EXTRACTO";
}
