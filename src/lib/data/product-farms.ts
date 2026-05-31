"use client";

import { createClient } from "@/lib/supabase/client";
import {
  listPortalFarmsAction,
  listPortalGeneticsAction,
} from "@/app/(dashboard)/inventario/farm-actions";
import { resolveProductMedia } from "@/lib/catalog-media";
import type { FarmGenetic, Product, ProductFarm } from "@/types";

type FarmRow = {
  id: string;
  name: string;
  description: string | null;
  photos: string[] | null;
  video_urls: string[] | null;
  sort_order: number;
};

type GeneticRow = {
  id: string;
  farm_id: string;
  name: string;
  description: string | null;
  photos: string[] | null;
  video_urls: string[] | null;
  price_per_unit: number;
  compare_at_price: number | null;
  genetics: FarmGenetic["genetics"];
  thc_percent: number | null;
  origin: FarmGenetic["origin"];
  sort_order: number;
};

function toFarm(r: FarmRow): ProductFarm {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    photos: r.photos ?? [],
    videoUrls: r.video_urls ?? [],
    sortOrder: r.sort_order,
  };
}

function toGenetic(r: GeneticRow): FarmGenetic {
  return {
    id: r.id,
    farmId: r.farm_id,
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

const FARM_SELECT =
  "id, name, description, photos, video_urls, sort_order";

const GENETIC_SELECT =
  "id, farm_id, name, description, photos, video_urls, price_per_unit, compare_at_price, genetics, thc_percent, origin, sort_order";

export async function fetchClubFarms(): Promise<ProductFarm[]> {
  try {
    const res = await listPortalFarmsAction();
    if (res.farms) return res.farms;
    if (res.error && isMissingTableMessage(res.error)) return [];
  } catch {
    /* fallback cliente */
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_farms")
    .select(FARM_SELECT)
    .order("sort_order")
    .order("name");
  if (error) {
    if (isMissingTableMessage(error.message)) return [];
    throw error;
  }
  return (data as FarmRow[]).map(toFarm);
}

function isMissingTableMessage(message: string) {
  return /product_farms|farm_genetics/i.test(message) &&
    (/does not exist|schema cache|Ejecuta supabase/i.test(message));
}

export async function fetchFarmGenetics(
  farmId?: string,
): Promise<FarmGenetic[]> {
  try {
    const res = await listPortalGeneticsAction(farmId);
    if (res.genetics) return res.genetics;
    if (res.error && isMissingTableMessage(res.error)) return [];
  } catch {
    /* fallback cliente */
  }

  const supabase = createClient();
  let query = supabase
    .from("farm_genetics")
    .select(GENETIC_SELECT)
    .order("sort_order")
    .order("name");
  if (farmId) query = query.eq("farm_id", farmId);

  const { data, error } = await query;
  if (error) {
    if (isMissingTableMessage(error.message)) return [];
    throw error;
  }
  return (data as GeneticRow[]).map(toGenetic);
}

/** Genéticas con stock y producto de carrito resuelto. */
export async function fetchPortalFarmGenetics(
  products: Product[],
  farmId?: string,
): Promise<FarmGenetic[]> {
  const genetics = await fetchFarmGenetics(farmId);
  const visible = products.filter((p) => !p.hiddenFromMembers);

  return genetics.map((g) => {
    const linked = visible.filter((p) => p.geneticId === g.id);
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

export function geneticToProductPreview(
  genetic: FarmGenetic,
  product?: Product | null,
  farm?: ProductFarm | null,
): Product {
  const { photos, videoUrls } = resolveProductMedia(product, genetic, farm);
  return {
    id: product?.id ?? genetic.id,
    name: genetic.name,
    category: product?.category ?? "FLOR",
    sku: product?.sku ?? "",
    stock: genetic.stock ?? product?.stock ?? 0,
    unit: product?.unit ?? "g",
    lowStockThreshold: product?.lowStockThreshold ?? 10,
    pricePerUnit: genetic.pricePerUnit,
    compareAtPrice: genetic.compareAtPrice,
    batch: product?.batch ?? "—",
    expiresAt: product?.expiresAt ?? null,
    photos,
    videoUrls,
    grower: product?.grower ?? null,
    thcPercent: genetic.thcPercent ?? product?.thcPercent ?? null,
    genetics: genetic.genetics ?? product?.genetics ?? null,
    origin: genetic.origin ?? product?.origin ?? null,
    description: genetic.description ?? product?.description ?? null,
    farmId: genetic.farmId,
    geneticId: genetic.id,
    hiddenFromMembers: product?.hiddenFromMembers ?? false,
  };
}
