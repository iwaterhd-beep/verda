"use client";

import { createClient } from "@/lib/supabase/client";
import { productHasMedia } from "@/lib/data/product-media";
import type { Product } from "@/types";

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

function toProduct(r: Row): Product {
  const videoUrls =
    r.video_urls?.length ? r.video_urls : r.video_url ? [r.video_url] : [];
  return {
    id: r.id,
    name: r.name,
    category: r.category as Product["category"],
    sku: r.sku ?? "",
    stock: Number(r.stock),
    unit: r.unit as Product["unit"],
    lowStockThreshold: Number(r.low_stock_threshold),
    pricePerUnit: Number(r.price_per_unit),
    batch: r.batch ?? "—",
    expiresAt: r.expires_at,
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

export async function fetchClubProducts(): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data as Row[]).map(toProduct);
}

/** Menú del portal: solo productos con stock visible para socios. */
export async function fetchPortalProducts(): Promise<Product[]> {
  const products = await fetchClubProducts();
  return products.filter((p) => p.stock > 0 || productHasMedia(p));
}
