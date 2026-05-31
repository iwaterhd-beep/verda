"use client";

import { createClient } from "@/lib/supabase/client";
import { enrichProductsWithCatalogMedia } from "@/lib/data/catalog-product-media";
import { productHasMedia } from "@/lib/data/product-media";
import type { PackItem, Product } from "@/types";

type Row = {
  id: string;
  name: string;
  category: string;
  sku: string | null;
  stock: number;
  unit: string;
  low_stock_threshold: number;
  price_per_unit: number;
  compare_at_price?: number | null;
  batch: string | null;
  expires_at: string | null;
  is_pack?: boolean | null;
  photos?: string[] | null;
  video_url?: string | null;
  video_urls?: string[] | null;
  grower?: string | null;
  extractor?: string | null;
  thc_percent?: number | null;
  genetics?: Product["genetics"];
  origin?: Product["origin"];
  description?: string | null;
  hidden_from_members?: boolean | null;
  farm_id?: string | null;
  genetic_id?: string | null;
  jar_id?: string | null;
  jar_item_id?: string | null;
};

type PackItemRow = {
  pack_id: string;
  product_id: string;
  qty: number;
  unit: string;
  sort_order: number;
};

function toProduct(r: Row, packItems?: PackItem[]): Product {
  const videoUrls =
    r.video_urls?.length ? r.video_urls : r.video_url ? [r.video_url] : [];
  const isPack = Boolean(r.is_pack) || r.unit === "pack";
  return {
    id: r.id,
    name: r.name,
    category: r.category as Product["category"],
    sku: r.sku ?? "",
    stock: Number(r.stock),
    unit: isPack ? "pack" : (r.unit as Product["unit"]),
    lowStockThreshold: Number(r.low_stock_threshold),
    pricePerUnit: Number(r.price_per_unit),
    compareAtPrice:
      r.compare_at_price != null ? Number(r.compare_at_price) : null,
    batch: r.batch ?? "—",
    expiresAt: r.expires_at,
    isPack,
    packItems: isPack ? packItems ?? [] : undefined,
    photos: r.photos ?? [],
    videoUrls,
    videoUrl: videoUrls[0] ?? null,
    grower: r.grower ?? null,
    extractor: r.extractor ?? null,
    thcPercent: r.thc_percent != null ? Number(r.thc_percent) : null,
    genetics: r.genetics ?? null,
    origin: r.origin ?? null,
    description: r.description ?? null,
    hiddenFromMembers: Boolean(r.hidden_from_members),
    farmId: r.farm_id ?? null,
    geneticId: r.genetic_id ?? null,
    jarId: r.jar_id ?? null,
    jarItemId: r.jar_item_id ?? null,
  };
}

async function fetchPackItemsMap(
  productRows: Row[],
): Promise<Map<string, PackItem[]>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_pack_items")
    .select("pack_id, product_id, qty, unit, sort_order")
    .order("sort_order");
  if (error) return new Map();

  const nameById = new Map(productRows.map((p) => [p.id, p.name]));

  const map = new Map<string, PackItem[]>();
  for (const row of (data ?? []) as PackItemRow[]) {
    const item: PackItem = {
      productId: row.product_id,
      productName: nameById.get(row.product_id),
      qty: Number(row.qty),
      unit: row.unit as PackItem["unit"],
    };
    const list = map.get(row.pack_id) ?? [];
    list.push(item);
    map.set(row.pack_id, list);
  }
  return map;
}

export async function fetchClubProducts(): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name");
  if (error) throw error;

  const rows = data as Row[];
  const packMap = await fetchPackItemsMap(rows);
  const products = rows.map((r) => toProduct(r, packMap.get(r.id)));
  return enrichProductsWithCatalogMedia(products);
}

/** Menú del portal: socios no ven productos ocultos ni agotados sin media. */
export async function fetchPortalProducts(): Promise<Product[]> {
  const products = await fetchClubProducts();
  return products.filter(
    (p) => !p.hiddenFromMembers && (p.stock > 0 || productHasMedia(p)),
  );
}

/** Productos estándar disponibles como componentes de un pack. */
export async function fetchPackComponentProducts(): Promise<Product[]> {
  const products = await fetchClubProducts();
  return products.filter((p) => !p.isPack);
}
