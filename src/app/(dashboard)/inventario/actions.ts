"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { defaultCatalog } from "@/lib/catalog";
import { collectProductStoragePaths } from "@/lib/product-media-storage";
import { isValidClubCategory } from "@/app/(dashboard)/inventario/category-actions";
import { isCannabisCategory } from "@/lib/product-categories";
import {
  MAX_PRODUCT_PHOTOS,
  MAX_PRODUCT_VIDEOS,
  MAX_VIDEO_BYTES,
  maxVideoSizeLabel,
} from "@/lib/product-media-limits";
import type { Product } from "@/types";

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
  videoUrls?: string[];
  /** @deprecated Usa videoUrls */
  videoUrl?: string | null;
  grower?: string;
  extractor?: string;
  thcPercent?: number | null;
  genetics?: Product["genetics"];
  origin?: Product["origin"];
  description?: string;
}

export interface ProductActionResult {
  error?: string;
  id?: string;
}

const ALLOWED_GENETICS = ["INDICA", "SATIVA", "HYBRID"] as const;
const ALLOWED_ORIGINS = [
  "SPAIN",
  "CALIFORNIA",
  "NETHERLANDS",
  "THAILAND",
  "CANADA",
] as const;
const ALLOWED_UNITS = ["g", "ud"] as const;

function strainFieldsFromInput(input: ProductInput, isCannabis: boolean) {
  if (!isCannabis) {
    return {
      grower: null,
      extractor: null,
      thc_percent: null,
      genetics: null,
      origin: null,
      description: null,
    };
  }

  const thc =
    input.thcPercent != null && input.thcPercent >= 0
      ? Math.round(input.thcPercent * 10) / 10
      : null;

  return {
    grower: input.grower?.trim() || null,
    extractor: input.extractor?.trim() || null,
    thc_percent: thc,
    genetics: input.genetics || null,
    origin: input.origin || null,
    description: input.description?.trim() || null,
  };
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

function validateProductInput(input: ProductInput): string | null {
  const name = input.name.trim();
  if (!name) return "El nombre es obligatorio.";
  if (!(input.stock >= 0)) return "El stock no puede ser negativo.";
  if (!(input.pricePerUnit >= 0)) return "El precio no puede ser negativo.";
  if (!(input.lowStockThreshold >= 0)) {
    return "El umbral de stock bajo no puede ser negativo.";
  }
  if (!ALLOWED_UNITS.includes(input.unit)) return "Unidad de venta no válida.";
  if ((input.photos?.length ?? 0) > MAX_PRODUCT_PHOTOS) {
    return `Máximo ${MAX_PRODUCT_PHOTOS} fotos por producto.`;
  }
  if ((input.videoUrls?.length ?? 0) > MAX_PRODUCT_VIDEOS) {
    return `Máximo ${MAX_PRODUCT_VIDEOS} vídeos por producto.`;
  }
  if (input.genetics && !ALLOWED_GENETICS.includes(input.genetics)) {
    return "Genética no válida.";
  }
  if (input.origin && !ALLOWED_ORIGINS.includes(input.origin)) {
    return "Origen no válido.";
  }
  if (input.thcPercent != null && (input.thcPercent < 0 || input.thcPercent > 100)) {
    return "El THC debe estar entre 0 y 100.";
  }
  return null;
}

function rowFromInput(
  input: ProductInput,
  skuFallback: string,
  isCannabis: boolean,
) {
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
    video_urls: input.videoUrls ?? [],
    video_url: input.videoUrls?.[0] ?? null,
    ...strainFieldsFromInput(input, isCannabis),
  };
}

function isMissingOptionalColumnError(message: string) {
  return /photos|video_url|video_urls|grower|extractor|thc_percent|genetics|origin|description/i.test(
    message,
  );
}

function baseRowFromInput(
  input: ProductInput,
  skuFallback: string,
  isCannabis: boolean,
) {
  const row = rowFromInput(input, skuFallback, isCannabis);
  const {
    photos: _p,
    video_url: _v,
    video_urls: _vs,
    grower: _g,
    extractor: _e,
    thc_percent: _t,
    genetics: _ge,
    origin: _o,
    description: _d,
    ...base
  } = row;
  return base;
}

async function updateProductRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
  productId: string,
  input: ProductInput,
  sku: string,
  isCannabis: boolean,
) {
  const fullRow = rowFromInput(input, sku, isCannabis);
  let result = await supabase
    .from("products")
    .update(fullRow)
    .eq("club_id", clubId)
    .eq("id", productId)
    .select("id")
    .maybeSingle();

  if (
    result.error &&
    isMissingOptionalColumnError(result.error.message)
  ) {
    result = await supabase
      .from("products")
      .update(baseRowFromInput(input, sku, isCannabis))
      .eq("club_id", clubId)
      .eq("id", productId)
      .select("id")
      .maybeSingle();
  }

  return result;
}

export async function createProductAction(
  input: ProductInput,
): Promise<ProductActionResult> {
  const validation = validateProductInput(input);
  if (validation) return { error: validation };

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const categoryOk = await isValidClubCategory(
    auth.clubId,
    auth.supabase,
    input.category,
  );
  if (!categoryOk) return { error: "Categoría no válida." };

  const { data: catRow } = await auth.supabase
    .from("product_categories")
    .select("is_cannabis")
    .eq("club_id", auth.clubId)
    .eq("id", input.category)
    .maybeSingle();
  const isCannabis =
    catRow?.is_cannabis ?? isCannabisCategory(input.category);

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
    ...rowFromInput(input, sku, isCannabis),
  });

  if (error) {
    if (isMissingOptionalColumnError(error.message)) {
      const retry = await auth.supabase.from("products").insert({
        id,
        club_id: auth.clubId,
        ...baseRowFromInput(input, sku, isCannabis),
      });
      if (retry.error) return { error: retry.error.message };
      return { id };
    }
    return { error: error.message };
  }
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

  const categoryOk = await isValidClubCategory(
    auth.clubId,
    auth.supabase,
    input.category,
  );
  if (!categoryOk) return { error: "Categoría no válida." };

  const { data: catRow } = await auth.supabase
    .from("product_categories")
    .select("is_cannabis")
    .eq("club_id", auth.clubId)
    .eq("id", input.category)
    .maybeSingle();
  const isCannabis =
    catRow?.is_cannabis ?? isCannabisCategory(input.category);

  const sku =
    input.sku?.trim() ||
    input.name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 6) ||
    "SKU";

  const { data, error } = await updateProductRow(
    auth.supabase,
    auth.clubId,
    productId,
    input,
    sku,
    isCannabis,
  );

  if (error) return { error: error.message };
  if (!data) return { error: "No se encontró el producto." };
  return { id: productId };
}

export async function deleteProductAction(
  productId: string,
): Promise<{ error?: string }> {
  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const { data: product } = await auth.supabase
    .from("products")
    .select("photos, video_url, video_urls")
    .eq("club_id", auth.clubId)
    .eq("id", productId)
    .maybeSingle();

  const { error } = await auth.supabase
    .from("products")
    .delete()
    .eq("club_id", auth.clubId)
    .eq("id", productId);

  if (error) return { error: error.message };

  try {
    const admin = createAdminClient();
    const videos = product?.video_urls?.length
      ? product.video_urls
      : product?.video_url
        ? [product.video_url]
        : [];
    const paths = collectProductStoragePaths(product?.photos ?? [], videos);
    if (paths.length) {
      await admin.storage.from("product-media").remove(paths);
    }
  } catch {
    /* el producto ya se borró */
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
  if (
    !file ||
    typeof file === "string" ||
    !("size" in file) ||
    file.size === 0
  ) {
    return { error: "Selecciona un vídeo." };
  }
  const videoFile = file as File;
  if (!videoFile.type.startsWith("video/")) {
    return { error: "El archivo debe ser un vídeo." };
  }
  if (videoFile.size > MAX_VIDEO_BYTES) {
    return { error: `El vídeo no puede superar ${maxVideoSizeLabel()}.` };
  }

  const ext = videoFile.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${auth.clubId}/${productId}/video.${ext}`;
  const admin = createAdminClient();
  const buffer = Buffer.from(await videoFile.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("product-media")
    .upload(path, buffer, { contentType: videoFile.type, upsert: true });

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
