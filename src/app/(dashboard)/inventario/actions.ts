"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { defaultCatalog } from "@/lib/catalog";

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
      photos: [],
    })),
  );
}

export async function ensureClubCatalogAction(): Promise<{ error?: string }> {
  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };
  await ensureClubProducts(auth.clubId);
  return {};
}

export interface ProductInput {
  name: string;
  category: string;
  sku?: string;
  stock: number;
  unit: "g" | "ud";
  lowStockThreshold: number;
  pricePerUnit: number;
  batch?: string;
  expiresAt?: string | null;
  photos?: string[];
  videoUrl?: string | null;
}

export interface ProductActionResult {
  error?: string;
  id?: string;
}

const ALLOWED_CATEGORIES = ["FLOR", "EXTRACTO", "COMESTIBLE", "MERCH", "OTRO"];
const MAX_PHOTOS = 4;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

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

function validateProductInput(input: ProductInput): string | null {
  const name = input.name.trim();
  if (!name) return "El nombre es obligatorio.";
  if (!(input.stock >= 0)) return "El stock no puede ser negativo.";
  if (!(input.pricePerUnit >= 0)) return "El precio no puede ser negativo.";
  if (!(input.lowStockThreshold >= 0)) {
    return "El umbral de stock bajo no puede ser negativo.";
  }
  if (!ALLOWED_CATEGORIES.includes(input.category)) return "Categoría no válida.";
  if ((input.photos?.length ?? 0) > MAX_PHOTOS) {
    return `Máximo ${MAX_PHOTOS} fotos por producto.`;
  }
  return null;
}

function rowFromInput(input: ProductInput, skuFallback: string) {
  return {
    name: input.name.trim(),
    category: input.category,
    sku: input.sku?.trim() || skuFallback,
    stock: Math.round(input.stock * 100) / 100,
    unit: input.unit,
    low_stock_threshold: Math.round(input.lowStockThreshold * 100) / 100,
    price_per_unit: Math.round(input.pricePerUnit * 100) / 100,
    batch: input.batch?.trim() || null,
    expires_at: input.expiresAt || null,
    photos: input.photos ?? [],
    video_url: input.videoUrl ?? null,
  };
}

export async function createProductAction(
  input: ProductInput,
): Promise<ProductActionResult> {
  const validation = validateProductInput(input);
  if (validation) return { error: validation };

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const id = productIdFromName(input.name);
  const sku =
    input.sku?.trim() ||
    input.name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 6) ||
    "SKU";

  const { error } = await auth.supabase.from("products").insert({
    id,
    club_id: auth.clubId,
    ...rowFromInput(input, sku),
  });

  if (error) return { error: error.message };
  return { id };
}

export async function updateProductAction(
  productId: string,
  input: ProductInput,
): Promise<ProductActionResult> {
  const validation = validateProductInput(input);
  if (validation) return { error: validation };

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const sku =
    input.sku?.trim() ||
    input.name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 6) ||
    "SKU";

  const { error } = await auth.supabase
    .from("products")
    .update(rowFromInput(input, sku))
    .eq("club_id", auth.clubId)
    .eq("id", productId);

  if (error) return { error: error.message };
  return { id: productId };
}

export async function deleteProductAction(
  productId: string,
): Promise<{ error?: string }> {
  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const { data: product } = await auth.supabase
    .from("products")
    .select("video_url")
    .eq("club_id", auth.clubId)
    .eq("id", productId)
    .maybeSingle();

  const { error } = await auth.supabase
    .from("products")
    .delete()
    .eq("club_id", auth.clubId)
    .eq("id", productId);

  if (error) return { error: error.message };

  if (product?.video_url) {
    try {
      const admin = createAdminClient();
      const marker = "/product-media/";
      const idx = product.video_url.indexOf(marker);
      if (idx !== -1) {
        const path = decodeURIComponent(
          product.video_url.slice(idx + marker.length).split("?")[0],
        );
        await admin.storage.from("product-media").remove([path]);
      }
    } catch {
      /* el producto ya se borró */
    }
  }

  return {};
}

export async function uploadProductVideoAction(
  productId: string,
  formData: FormData,
): Promise<{ error?: string; url?: string }> {
  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const file = formData.get("video");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona un vídeo." };
  }
  if (!file.type.startsWith("video/")) {
    return { error: "El archivo debe ser un vídeo." };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { error: "El vídeo no puede superar 25 MB." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${auth.clubId}/${productId}/video.${ext}`;
  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("product-media")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = admin.storage.from("product-media").getPublicUrl(path);

  const { error: updateError } = await auth.supabase
    .from("products")
    .update({ video_url: publicUrl })
    .eq("club_id", auth.clubId)
    .eq("id", productId);

  if (updateError) return { error: updateError.message };
  return { url: publicUrl };
}

export async function removeProductVideoAction(
  productId: string,
): Promise<{ error?: string }> {
  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const { data: product } = await auth.supabase
    .from("products")
    .select("video_url")
    .eq("club_id", auth.clubId)
    .eq("id", productId)
    .maybeSingle();

  const { error } = await auth.supabase
    .from("products")
    .update({ video_url: null })
    .eq("club_id", auth.clubId)
    .eq("id", productId);

  if (error) return { error: error.message };

  if (product?.video_url) {
    try {
      const admin = createAdminClient();
      const marker = "/product-media/";
      const idx = product.video_url.indexOf(marker);
      if (idx !== -1) {
        const storagePath = decodeURIComponent(
          product.video_url.slice(idx + marker.length).split("?")[0],
        );
        await admin.storage.from("product-media").remove([storagePath]);
      }
    } catch {
      /* ignorar */
    }
  }

  return {};
}
