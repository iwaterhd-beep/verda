"use client";

import { createClient } from "@/lib/supabase/client";
import {
  listPortalJarsAction,
  listPortalJarItemsAction,
} from "@/app/(dashboard)/inventario/jar-actions";
import { resolveProductMedia } from "@/lib/catalog-media";
import type { JarItem, Product, ProductJar } from "@/types";

type JarRow = {
  id: string;
  name: string;
  description: string | null;
  photos: string[] | null;
  video_urls: string[] | null;
  sort_order: number;
};

type JarItemRow = {
  id: string;
  jar_id: string;
  name: string;
  description: string | null;
  photos: string[] | null;
  video_urls: string[] | null;
  price_per_unit: number;
  compare_at_price: number | null;
  genetics: JarItem["genetics"];
  thc_percent: number | null;
  origin: JarItem["origin"];
  sort_order: number;
};

function toJar(r: JarRow): ProductJar {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    photos: r.photos ?? [],
    videoUrls: r.video_urls ?? [],
    sortOrder: r.sort_order,
  };
}

function toJarItem(r: JarItemRow): JarItem {
  return {
    id: r.id,
    jarId: r.jar_id,
    name: r.name,
    description: r.description,
    photos: r.photos ?? [],
    videoUrls: r.video_urls ?? [],
    pricePerUnit: Number(r.price_per_unit),
    compareAtPrice:
      r.compare_at_price != null ? Number(r.compare_at_price) : null,
    genetics: r.genetics ?? null,
    thcPercent: r.thc_percent != null ? Number(r.thc_percent) : null,
    origin: r.origin ?? null,
    sortOrder: r.sort_order,
  };
}

const JAR_SELECT =
  "id, name, description, photos, video_urls, sort_order";

const JAR_ITEM_SELECT =
  "id, jar_id, name, description, photos, video_urls, price_per_unit, compare_at_price, genetics, thc_percent, origin, sort_order";

export async function fetchClubJars(): Promise<ProductJar[]> {
  try {
    const res = await listPortalJarsAction();
    if (res.jars) return res.jars;
    if (res.error && isMissingTableMessage(res.error)) return [];
  } catch {
    /* fallback cliente */
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_jars")
    .select(JAR_SELECT)
    .order("sort_order")
    .order("name");
  if (error) {
    if (isMissingTableMessage(error.message)) return [];
    throw error;
  }
  return (data as JarRow[]).map(toJar);
}

function isMissingTableMessage(message: string) {
  return /product_jars|jar_items/i.test(message) &&
    (/does not exist|schema cache|Ejecuta supabase/i.test(message));
}

export async function fetchJarItems(
  jarId?: string,
): Promise<JarItem[]> {
  try {
    const res = await listPortalJarItemsAction(jarId);
    if (res.items) return res.items;
    if (res.error && isMissingTableMessage(res.error)) return [];
  } catch {
    /* fallback cliente */
  }

  const supabase = createClient();
  let query = supabase
    .from("jar_items")
    .select(JAR_ITEM_SELECT)
    .order("sort_order")
    .order("name");
  if (jarId) query = query.eq("jar_id", jarId);

  const { data, error } = await query;
  if (error) {
    if (isMissingTableMessage(error.message)) return [];
    throw error;
  }
  return (data as JarItemRow[]).map(toJarItem);
}

/** Ítems con stock y producto de carrito resuelto. */
export async function fetchPortalJarItems(
  products: Product[],
  jarId?: string,
): Promise<JarItem[]> {
  const items = await fetchJarItems(jarId);
  const visible = products.filter((p) => !p.hiddenFromMembers);

  return items.map((g) => {
    const linked = visible.filter((p) => p.jarItemId === g.id);
    const inStock = linked.filter((p) => p.stock > 0);
    const pick = inStock[0] ?? linked[0];
    const stock = linked.reduce((a, p) => a + p.stock, 0);
    return {
      ...g,
      stock: Math.round(stock * 100) / 100,
      productId: pick?.id ?? null,
    };
  });
}

export function jarItemToProductPreview(
  item: JarItem,
  product?: Product | null,
  jar?: ProductJar | null,
): Product {
  const { photos, videoUrls } = resolveProductMedia(product, item, jar);
  return {
    id: product?.id ?? item.id,
    name: item.name,
    category: product?.category ?? "FLOR",
    sku: product?.sku ?? "",
    stock: item.stock ?? product?.stock ?? 0,
    unit: product?.unit ?? "g",
    lowStockThreshold: product?.lowStockThreshold ?? 10,
    pricePerUnit: item.pricePerUnit,
    compareAtPrice: item.compareAtPrice,
    batch: product?.batch ?? "—",
    expiresAt: product?.expiresAt ?? null,
    photos,
    videoUrls,
    grower: product?.grower ?? null,
    thcPercent: item.thcPercent ?? product?.thcPercent ?? null,
    genetics: item.genetics ?? product?.genetics ?? null,
    origin: item.origin ?? product?.origin ?? null,
    description: item.description ?? product?.description ?? null,
    jarId: item.jarId,
    jarItemId: item.id,
    hiddenFromMembers: product?.hiddenFromMembers ?? false,
  };
}
