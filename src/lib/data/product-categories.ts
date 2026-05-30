"use client";

import { createClient } from "@/lib/supabase/client";
import { DEFAULT_PRODUCT_CATEGORIES } from "@/lib/product-categories";
import { listClubCategoriesAction } from "@/app/(dashboard)/inventario/category-actions";
import type { ProductCategory } from "@/types";

type Row = {
  id: string;
  label: string;
  emoji: string;
  sort_order: number;
  is_cannabis: boolean;
};

function toCategory(r: Row): ProductCategory {
  return {
    id: r.id,
    label: r.label,
    emoji: r.emoji,
    sortOrder: r.sort_order,
    isCannabis: r.is_cannabis,
  };
}

export async function fetchClubCategories(): Promise<ProductCategory[]> {
  try {
    const res = await listClubCategoriesAction();
    if (res.categories?.length) return res.categories;
    if (res.error?.includes("product_categories")) {
      return DEFAULT_PRODUCT_CATEGORIES;
    }
  } catch {
    /* fallback abajo */
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, label, emoji, sort_order, is_cannabis")
    .order("sort_order")
    .order("label");

  if (error || !data?.length) return DEFAULT_PRODUCT_CATEGORIES;
  return (data as Row[]).map(toCategory);
}
