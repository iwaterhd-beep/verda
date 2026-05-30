import { isCannabisCategory } from "@/lib/product-categories";
import type { ProductCategory } from "@/types";

export type ProductGenetics = "INDICA" | "SATIVA" | "HYBRID";
export type ProductOrigin =
  | "SPAIN"
  | "CALIFORNIA"
  | "NETHERLANDS"
  | "THAILAND"
  | "CANADA";

export const geneticsOptions: { value: ProductGenetics; label: string }[] = [
  { value: "INDICA", label: "Índica" },
  { value: "SATIVA", label: "Sativa" },
  { value: "HYBRID", label: "Híbrida" },
];

export const originOptions: { value: ProductOrigin; label: string }[] = [
  { value: "SPAIN", label: "España" },
  { value: "CALIFORNIA", label: "California" },
  { value: "NETHERLANDS", label: "Holanda" },
  { value: "THAILAND", label: "Tailandia" },
  { value: "CANADA", label: "Canadá" },
];

const geneticsLabels: Record<ProductGenetics, string> = {
  INDICA: "Índica",
  SATIVA: "Sativa",
  HYBRID: "Híbrida",
};

const originLabels: Record<ProductOrigin, string> = {
  SPAIN: "España",
  CALIFORNIA: "California",
  NETHERLANDS: "Holanda",
  THAILAND: "Tailandia",
  CANADA: "Canadá",
};

export function isCannabisProduct(
  category: string,
  categories?: ProductCategory[],
) {
  return isCannabisCategory(category, categories);
}

export function geneticsLabel(value?: ProductGenetics | null) {
  return value ? geneticsLabels[value] : null;
}

export function originLabel(value?: ProductOrigin | null) {
  return value ? originLabels[value] : null;
}

export function formatThcPercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) return null;
  return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}% THC`;
}
