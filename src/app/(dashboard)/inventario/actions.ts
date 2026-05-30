"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { defaultCatalog } from "@/lib/catalog";

async function ensureClubProducts(clubId: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("products")
    .select("id")
    .eq("club_id", clubId);
  const have = new Set((existing ?? []).map((r) => r.id));
  const missing = defaultCatalog.filter((p) => !have.has(p.id));
  if (!missing.length) return;

  await admin.from("products").insert(
    missing.map((p) => ({
      id: p.id,
      club_id: clubId,
      name: p.name,
      category: p.category,
      sku: p.sku,
      stock: p.stock,
      unit: p.unit,
      low_stock_threshold: p.lowStockThreshold,
      price_per_unit: p.pricePerUnit,
      batch: p.batch === "—" ? null : p.batch,
      expires_at: p.expiresAt,
    })),
  );
}

export async function ensureClubCatalogAction(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role === "MEMBER" || !profile.club_id) {
    return { error: "Sin permisos." };
  }

  await ensureClubProducts(profile.club_id as string);
  return {};
}

export interface CreateProductInput {
  name: string;
  category: string;
  sku?: string;
  stock: number;
  unit: "g" | "ud";
  lowStockThreshold: number;
  pricePerUnit: number;
  batch?: string;
  expiresAt?: string | null;
}

export interface CreateProductResult {
  error?: string;
  id?: string;
}

function productIdFromName(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return `p-${base || "prod"}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function createProductAction(
  input: CreateProductInput,
): Promise<CreateProductResult> {
  const name = input.name.trim();
  if (!name) return { error: "El nombre es obligatorio." };
  if (!(input.stock >= 0)) return { error: "El stock no puede ser negativo." };
  if (!(input.pricePerUnit >= 0)) return { error: "El precio no puede ser negativo." };
  if (!(input.lowStockThreshold >= 0)) {
    return { error: "El umbral de stock bajo no puede ser negativo." };
  }

  const allowedCategories = ["FLOR", "EXTRACTO", "COMESTIBLE", "MERCH", "OTRO"];
  if (!allowedCategories.includes(input.category)) {
    return { error: "Categoría no válida." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role === "MEMBER" || !profile.club_id) {
    return { error: "Sin permisos." };
  }

  const clubId = profile.club_id as string;
  const id = productIdFromName(name);
  const sku =
    input.sku?.trim() ||
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 6) || "SKU";

  const { error } = await supabase.from("products").insert({
    id,
    club_id: clubId,
    name,
    category: input.category,
    sku,
    stock: Math.round(input.stock * 100) / 100,
    unit: input.unit,
    low_stock_threshold: Math.round(input.lowStockThreshold * 100) / 100,
    price_per_unit: Math.round(input.pricePerUnit * 100) / 100,
    batch: input.batch?.trim() || null,
    expires_at: input.expiresAt || null,
  });

  if (error) return { error: error.message };
  return { id };
}
