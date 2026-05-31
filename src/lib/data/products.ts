"use client";

import { createClient } from "@/lib/supabase/client";
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
};

type PackItemRow = {
  pack_id: string;
  product_id: string;
  qty: number;
  unit: string;
  sort_order: number;
  products?: { name: string } | { name: string }[] | null;
};

function packItemName(row: PackItemRow): string | undefined {
  const p = row.products;
  if (!p) return undefined;
  if (Array.isArray(p)) return p[0]?.name;
  return p.name;
}

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
  };
}

async function fetchPackItemsMap(): Promise<Map<string, PackItem[]>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_pack_items")
    .select("pack_id, product_id, qty, unit, sort_order, products(name)")
    .order("sort_order");
  if (error) return new Map();

  const map = new Map<string, PackItem[]>();
  for (const row of (data ?? []) as PackItemRow[]) {
    const item: PackItem = {
      productId: row.product_id,
      productName: packItemName(row),
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

  const packMap = await fetchPackItemsMap();
  return (data as Row[]).map((r) => toProduct(r, packMap.get(r.id)));
}

/** Menú del portal: solo productos con stock visible para socios. */
export async function fetchPortalProducts(): Promise<Product[]> {
  const products = await fetchClubProducts();
  return products.filter((p) => p.stock > 0 || productHasMedia(p));
}

/** Productos estándar disponibles como componentes de un pack. */
export async function fetchPackComponentProducts(): Promise<Product[]> {
  const products = await fetchClubProducts();
  return products.filter((p) => !p.isPack);
}
