import type { CSSProperties } from "react";
import type { ProductCategory } from "@/types";

export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  FLOR: "#10b981",
  HASH: "#78716c",
  EXTRACTO: "#f59e0b",
  COMESTIBLE: "#ec4899",
  MERCH: "#0ea5e9",
  OTRO: "#8b5cf6",
};

export const DEFAULT_PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: "FLOR", label: "Flor", emoji: "🌿", sortOrder: 0, isCannabis: true, color: "#10b981" },
  { id: "HASH", label: "Hash", emoji: "🧱", sortOrder: 1, isCannabis: true, color: "#78716c" },
  { id: "EXTRACTO", label: "Extracto", emoji: "🍯", sortOrder: 2, isCannabis: true, color: "#f59e0b" },
  { id: "COMESTIBLE", label: "Comestible", emoji: "🍬", sortOrder: 3, isCannabis: false, color: "#ec4899" },
  { id: "MERCH", label: "Merch", emoji: "👕", sortOrder: 4, isCannabis: false, color: "#0ea5e9" },
  { id: "OTRO", label: "Otro", emoji: "✨", sortOrder: 5, isCannabis: false, color: "#8b5cf6" },
];

const CATEGORY_GRADIENTS: Record<string, string> = {
  FLOR: "from-emerald-500/25 to-green-700/10",
  HASH: "from-stone-500/25 to-amber-900/10",
  EXTRACTO: "from-amber-500/25 to-orange-700/10",
  COMESTIBLE: "from-pink-500/25 to-rose-700/10",
  MERCH: "from-sky-500/25 to-blue-700/10",
  OTRO: "from-violet-500/25 to-purple-700/10",
};

const FALLBACK_PALETTE = [
  "#14b8a6",
  "#6366f1",
  "#f43f5e",
  "#84cc16",
  "#d946ef",
  "#0891b2",
];

export type CategoryDisplay = {
  label: string;
  formLabel: string;
  emoji: string;
  color: string;
  /** @deprecated Usa color + categorySurfaceStyle */
  gradient: string;
  isCannabis: boolean;
};

export function normalizeCategoryColor(color?: string | null): string | null {
  if (!color?.trim()) return null;
  const value = color.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(value)) {
    const h = value.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return null;
}

function colorFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % 997;
  }
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}

function gradientForId(id: string) {
  if (CATEGORY_GRADIENTS[id]) return CATEGORY_GRADIENTS[id];
  return "from-teal-500/25 to-cyan-700/10";
}

export function resolveCategoryColor(
  category: Pick<ProductCategory, "id" | "color">,
): string {
  return (
    normalizeCategoryColor(category.color) ??
    DEFAULT_CATEGORY_COLORS[category.id] ??
    colorFromId(category.id)
  );
}

export function categorySurfaceStyle(color: string): CSSProperties {
  return {
    background: `linear-gradient(135deg, color-mix(in srgb, ${color} 38%, transparent), color-mix(in srgb, ${color} 12%, transparent))`,
    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 22%, transparent)`,
  };
}

export function categoryChipStyle(color: string, active: boolean): CSSProperties {
  if (active) {
    return {
      borderColor: color,
      backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
      color,
    };
  }
  return {
    borderColor: `color-mix(in srgb, ${color} 28%, transparent)`,
  };
}

export function categoryBadgeStyle(color: string): CSSProperties {
  return {
    borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
    backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
    color,
  };
}

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

export function getCategoryDisplay(
  id: string,
  categories: ProductCategory[] = DEFAULT_PRODUCT_CATEGORIES,
): CategoryDisplay {
  const cat =
    categories.find((c) => c.id === id) ??
    DEFAULT_PRODUCT_CATEGORIES.find((c) => c.id === id);

  if (!cat) {
    const color = colorFromId(id);
    return {
      label: id,
      formLabel: id,
      emoji: "✨",
      color,
      gradient: gradientForId(id),
      isCannabis: false,
    };
  }

  const color = resolveCategoryColor(cat);
  return {
    label: cat.label,
    formLabel: cat.label,
    emoji: cat.emoji,
    color,
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
