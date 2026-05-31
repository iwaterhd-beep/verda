"use server";

import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_PRODUCT_CATEGORIES,
  categoryIdFromLabel,
  normalizeCategoryColor,
} from "@/lib/product-categories";
import type { ProductCategory } from "@/types";

async function staffClubId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role === "MEMBER" || !profile.club_id) {
    return { error: "Sin permisos." as const };
  }

  return { clubId: profile.club_id as string, supabase };
}

type CategoryRow = {
  id: string;
  label: string;
  emoji: string;
  sort_order: number;
  is_cannabis: boolean;
  color?: string | null;
};

function toCategory(r: CategoryRow): ProductCategory {
  return {
    id: r.id,
    label: r.label,
    emoji: r.emoji,
    sortOrder: r.sort_order,
    isCannabis: r.is_cannabis,
    color: normalizeCategoryColor(r.color),
  };
}

function isMissingCategoriesTable(message: string) {
  return /product_categories/i.test(message);
}

function isMissingColorColumn(message: string) {
  return /color/i.test(message) && /product_categories/i.test(message);
}

const CATEGORY_SELECT =
  "id, label, emoji, sort_order, is_cannabis, color";

export async function ensureClubCategories(
  clubId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data: existing } = await supabase
    .from("product_categories")
    .select("id")
    .eq("club_id", clubId);

  if (existing?.length) return;

  const rows = DEFAULT_PRODUCT_CATEGORIES.map((c) => ({
    id: c.id,
    club_id: clubId,
    label: c.label,
    emoji: c.emoji,
    sort_order: c.sortOrder,
    is_cannabis: c.isCannabis,
    color: c.color ?? null,
  }));

  await supabase.from("product_categories").insert(rows);
}

export async function listClubCategoriesAction(): Promise<{
  error?: string;
  categories?: ProductCategory[];
}> {
  const auth = await staffClubId();
  if ("error" in auth) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: auth.error };

    const { data: profile } = await supabase
      .from("profiles")
      .select("club_id")
      .eq("id", user.id)
      .single();
    if (!profile?.club_id) return { categories: DEFAULT_PRODUCT_CATEGORIES };

    const { data, error } = await supabase
      .from("product_categories")
      .select(CATEGORY_SELECT)
      .eq("club_id", profile.club_id)
      .order("sort_order")
      .order("label");

    if (error) {
      if (isMissingCategoriesTable(error.message)) {
        return { categories: DEFAULT_PRODUCT_CATEGORIES };
      }
      return { error: error.message };
    }

    if (!data?.length) return { categories: DEFAULT_PRODUCT_CATEGORIES };
    return { categories: (data as CategoryRow[]).map(toCategory) };
  }

  const { data, error } = await auth.supabase
    .from("product_categories")
    .select(CATEGORY_SELECT)
    .eq("club_id", auth.clubId)
    .order("sort_order")
    .order("label");

  if (error) {
    if (isMissingCategoriesTable(error.message)) {
      return { categories: DEFAULT_PRODUCT_CATEGORIES };
    }
    return { error: error.message };
  }

  if (!data?.length) {
    await ensureClubCategories(auth.clubId, auth.supabase);
    return listClubCategoriesAction();
  }

  return { categories: (data as CategoryRow[]).map(toCategory) };
}

export async function createCategoryAction(input: {
  label: string;
  emoji?: string;
  isCannabis?: boolean;
  color?: string;
}): Promise<{ error?: string; category?: ProductCategory }> {
  const label = input.label.trim();
  if (!label) return { error: "El nombre es obligatorio." };
  if (label.length > 40) return { error: "Máximo 40 caracteres." };

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  await ensureClubCategories(auth.clubId, auth.supabase);

  let id = categoryIdFromLabel(label);
  const { data: existing } = await auth.supabase
    .from("product_categories")
    .select("id")
    .eq("club_id", auth.clubId);

  const ids = new Set((existing ?? []).map((r) => r.id));
  if (ids.has(id)) {
    let n = 2;
    while (ids.has(`${id}_${n}`)) n++;
    id = `${id}_${n}`;
  }

  const { data: maxSort } = await auth.supabase
    .from("product_categories")
    .select("sort_order")
    .eq("club_id", auth.clubId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const emoji = (input.emoji?.trim() || "✨").slice(0, 8);
  const color = normalizeCategoryColor(input.color);
  const row = {
    id,
    club_id: auth.clubId,
    label,
    emoji,
    sort_order: (maxSort?.sort_order ?? -1) + 1,
    is_cannabis: Boolean(input.isCannabis),
    color,
  };

  let { error } = await auth.supabase.from("product_categories").insert(row);
  if (error && isMissingColorColumn(error.message)) {
    const { color: _c, ...rowWithoutColor } = row;
    ({ error } = await auth.supabase.from("product_categories").insert(rowWithoutColor));
  }
  if (error) {
    if (isMissingCategoriesTable(error.message)) {
      return {
        error: "Ejecuta supabase/product-categories.sql en Supabase primero.",
      };
    }
    return { error: error.message };
  }

  return {
    category: {
      id: row.id,
      label: row.label,
      emoji: row.emoji,
      sortOrder: row.sort_order,
      isCannabis: row.is_cannabis,
      color: row.color ?? undefined,
    },
  };
}

export async function updateCategoryColorAction(
  categoryId: string,
  color: string,
): Promise<{ error?: string; category?: ProductCategory }> {
  const id = categoryId.trim();
  if (!id) return { error: "Categoría no válida." };

  const normalized = normalizeCategoryColor(color);
  if (!normalized) return { error: "Color no válido. Usa formato #rrggbb." };

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from("product_categories")
    .update({ color: normalized })
    .eq("club_id", auth.clubId)
    .eq("id", id)
    .select(CATEGORY_SELECT)
    .maybeSingle();

  if (error) {
    if (isMissingColorColumn(error.message)) {
      return {
        error: "Ejecuta supabase/product-category-colors.sql en Supabase primero.",
      };
    }
    return { error: error.message };
  }
  if (!data) return { error: "No se encontró la categoría." };

  return { category: toCategory(data as CategoryRow) };
}

export async function deleteCategoryAction(
  categoryId: string,
): Promise<{ error?: string }> {
  const id = categoryId.trim();
  if (!id) return { error: "Categoría no válida." };

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const { count, error: countError } = await auth.supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("club_id", auth.clubId)
    .eq("category", id);

  if (countError) return { error: countError.message };
  if (count && count > 0) {
    return {
      error: `No se puede eliminar: hay ${count} producto(s) en esta categoría.`,
    };
  }

  const { error } = await auth.supabase
    .from("product_categories")
    .delete()
    .eq("club_id", auth.clubId)
    .eq("id", id);

  if (error) {
    if (isMissingCategoriesTable(error.message)) {
      return {
        error: "Ejecuta supabase/product-categories.sql en Supabase primero.",
      };
    }
    return { error: error.message };
  }

  return {};
}

export async function isValidClubCategory(
  clubId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryId: string,
) {
  await ensureClubCategories(clubId, supabase).catch(() => null);

  const { data, error } = await supabase
    .from("product_categories")
    .select("id")
    .eq("club_id", clubId)
    .eq("id", categoryId)
    .maybeSingle();

  if (error && isMissingCategoriesTable(error.message)) {
    return DEFAULT_PRODUCT_CATEGORIES.some((c) => c.id === categoryId);
  }

  return Boolean(data);
}
