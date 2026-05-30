import type { Product } from "@/types";

export const categoryMeta: Record<
  Product["category"],
  { label: string; emoji: string; gradient: string }
> = {
  FLOR: { label: "Flores", emoji: "🌿", gradient: "from-emerald-500/25 to-green-700/10" },
  EXTRACTO: { label: "Extractos", emoji: "🍯", gradient: "from-amber-500/25 to-orange-700/10" },
  COMESTIBLE: { label: "Comestibles", emoji: "🍬", gradient: "from-pink-500/25 to-rose-700/10" },
  MERCH: { label: "Merch", emoji: "👕", gradient: "from-sky-500/25 to-blue-700/10" },
  OTRO: { label: "Otros", emoji: "✨", gradient: "from-violet-500/25 to-purple-700/10" },
};

export const categoryOrder: Product["category"][] = [
  "FLOR",
  "EXTRACTO",
  "COMESTIBLE",
  "MERCH",
  "OTRO",
];
