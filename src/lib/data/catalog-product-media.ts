"use client";

import { createClient } from "@/lib/supabase/client";
import { resolveProductMedia } from "@/lib/catalog-media";
import { productVideoUrls } from "@/lib/data/product-media";
import type { Product } from "@/types";

type GeneticRow = {
  id: string;
  farm_id: string;
  photos: string[] | null;
  video_urls: string[] | null;
};

type FarmRow = {
  id: string;
  photos: string[] | null;
  video_urls: string[] | null;
};

type JarItemRow = {
  id: string;
  jar_id: string;
  photos: string[] | null;
  video_urls: string[] | null;
};

type JarRow = {
  id: string;
  photos: string[] | null;
  video_urls: string[] | null;
};

function rowToMedia(row: {
  photos: string[] | null;
  video_urls: string[] | null;
}) {
  return {
    photos: row.photos ?? [],
    videoUrls: row.video_urls ?? [],
  };
}

function productAsMedia(product: Product) {
  return {
    photos: product.photos ?? [],
    videoUrls: productVideoUrls(product),
  };
}

/** Enriquece productos vinculados a farms/jars con media del catálogo. */
export async function enrichProductsWithCatalogMedia(
  products: Product[],
): Promise<Product[]> {
  const geneticIds = [
    ...new Set(
      products.map((p) => p.geneticId).filter((id): id is string => Boolean(id)),
    ),
  ];
  const jarItemIds = [
    ...new Set(
      products.map((p) => p.jarItemId).filter((id): id is string => Boolean(id)),
    ),
  ];

  if (!geneticIds.length && !jarItemIds.length) return products;

  const supabase = createClient();
  const geneticsById = new Map<string, GeneticRow>();
  const farmsById = new Map<string, FarmRow>();
  const itemsById = new Map<string, JarItemRow>();
  const jarsById = new Map<string, JarRow>();

  if (geneticIds.length) {
    const { data: genetics } = await supabase
      .from("farm_genetics")
      .select("id, farm_id, photos, video_urls")
      .in("id", geneticIds);

    for (const row of (genetics ?? []) as GeneticRow[]) {
      geneticsById.set(row.id, row);
    }

    const farmIds = [
      ...new Set(
        (genetics ?? []).map((g: GeneticRow) => g.farm_id).filter(Boolean),
      ),
    ];
    if (farmIds.length) {
      const { data: farms } = await supabase
        .from("product_farms")
        .select("id, photos, video_urls")
        .in("id", farmIds);
      for (const row of (farms ?? []) as FarmRow[]) {
        farmsById.set(row.id, row);
      }
    }
  }

  if (jarItemIds.length) {
    const { data: items } = await supabase
      .from("jar_items")
      .select("id, jar_id, photos, video_urls")
      .in("id", jarItemIds);

    for (const row of (items ?? []) as JarItemRow[]) {
      itemsById.set(row.id, row);
    }

    const jarIds = [
      ...new Set((items ?? []).map((i: JarItemRow) => i.jar_id).filter(Boolean)),
    ];
    if (jarIds.length) {
      const { data: jars } = await supabase
        .from("product_jars")
        .select("id, photos, video_urls")
        .in("id", jarIds);
      for (const row of (jars ?? []) as JarRow[]) {
        jarsById.set(row.id, row);
      }
    }
  }

  return products.map((product) => {
    let next = product;

    if (product.geneticId) {
      const genetic = geneticsById.get(product.geneticId);
      if (genetic) {
        const farm = farmsById.get(genetic.farm_id);
        const media = resolveProductMedia(
          productAsMedia(next),
          rowToMedia(genetic),
          farm ? rowToMedia(farm) : null,
        );
        if (media.photos.length || media.videoUrls.length) {
          next = {
            ...next,
            photos: media.photos,
            videoUrls: media.videoUrls,
            videoUrl: media.videoUrls[0] ?? null,
          };
        }
      }
    }

    if (product.jarItemId) {
      const item = itemsById.get(product.jarItemId);
      if (item) {
        const jar = jarsById.get(item.jar_id);
        const media = resolveProductMedia(
          productAsMedia(next),
          rowToMedia(item),
          jar ? rowToMedia(jar) : null,
        );
        if (media.photos.length || media.videoUrls.length) {
          next = {
            ...next,
            photos: media.photos,
            videoUrls: media.videoUrls,
            videoUrl: media.videoUrls[0] ?? null,
          };
        }
      }
    }

    return next;
  });
}
