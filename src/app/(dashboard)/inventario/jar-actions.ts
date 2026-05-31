"use server";

import { createClient } from "@/lib/supabase/server";
import { jarIdFromName, jarItemIdFromName } from "@/lib/product-jars";
import type { JarItem, ProductJar } from "@/types";
import type { ProductGenetics, ProductOrigin } from "@/lib/product-strain";

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

function isMissingJarsTable(message: string) {
  return /product_jars|jar_items/i.test(message) &&
    /does not exist|schema cache/i.test(message);
}

async function resolveAuthClubId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id")
    .eq("id", user.id)
    .single();

  let clubId = (profile?.club_id as string | null) ?? null;
  if (!clubId) {
    const { data: member } = await supabase
      .from("members")
      .select("club_id")
      .eq("user_id", user.id)
      .maybeSingle();
    clubId = (member?.club_id as string | null) ?? null;
  }

  if (!clubId) return { error: "Sin club asignado." as const };
  return { clubId, supabase };
}

export async function listPortalJarsAction(): Promise<{
  error?: string;
  jars?: ProductJar[];
}> {
  const auth = await resolveAuthClubId();
  if ("error" in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from("product_jars")
    .select(
      "id, name, description, photos, video_urls, sort_order",
    )
    .eq("club_id", auth.clubId)
    .order("sort_order")
    .order("name");

  if (error) {
    if (isMissingJarsTable(error.message)) {
      return {
        error: "Ejecuta supabase/product-jars.sql en Supabase.",
      };
    }
    return { error: error.message };
  }

  return { jars: (data as JarRow[]).map(toJar) };
}

export async function listPortalJarItemsAction(jarId?: string): Promise<{
  error?: string;
  items?: JarItem[];
}> {
  const auth = await resolveAuthClubId();
  if ("error" in auth) return { error: auth.error };

  let query = auth.supabase
    .from("jar_items")
    .select(
      "id, jar_id, name, description, photos, video_urls, price_per_unit, compare_at_price, genetics, thc_percent, origin, sort_order",
    )
    .eq("club_id", auth.clubId)
    .order("sort_order")
    .order("name");

  if (jarId) query = query.eq("jar_id", jarId);

  const { data, error } = await query;
  if (error) {
    if (isMissingJarsTable(error.message)) {
      return {
        error: "Ejecuta supabase/product-jars.sql en Supabase.",
      };
    }
    return { error: error.message };
  }

  return { items: (data as JarItemRow[]).map(toJarItem) };
}

async function uniqueJarId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
  base: string,
) {
  let id = base;
  let n = 2;
  while (true) {
    const { data } = await supabase
      .from("product_jars")
      .select("id")
      .eq("club_id", clubId)
      .eq("id", id)
      .maybeSingle();
    if (!data) return id;
    id = `${base}_${n}`.slice(0, 32);
    n += 1;
  }
}

async function uniqueJarItemId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
  base: string,
) {
  let id = base;
  let n = 2;
  while (true) {
    const { data } = await supabase
      .from("jar_items")
      .select("id")
      .eq("club_id", clubId)
      .eq("id", id)
      .maybeSingle();
    if (!data) return id;
    id = `${base}_${n}`.slice(0, 48);
    n += 1;
  }
}

export async function createJarAction(input: {
  name: string;
  description?: string;
  photos?: string[];
  videoUrls?: string[];
}): Promise<{ error?: string; jar?: ProductJar }> {
  const name = input.name.trim();
  if (!name) return { error: "Indica un nombre para el jar." };

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const baseId = jarIdFromName(name);
  const id = await uniqueJarId(auth.supabase, auth.clubId, baseId);

  const { data, error } = await auth.supabase
    .from("product_jars")
    .insert({
      id,
      club_id: auth.clubId,
      name,
      description: input.description?.trim() || null,
      photos: input.photos ?? [],
      video_urls: input.videoUrls ?? [],
    })
    .select("id, name, description, photos, video_urls, sort_order")
    .single();

  if (error) {
    if (isMissingJarsTable(error.message)) {
      return { error: "Ejecuta supabase/product-jars.sql en Supabase." };
    }
    return { error: error.message };
  }

  return { jar: toJar(data as JarRow) };
}

export async function updateJarAction(
  jarId: string,
  input: {
    name: string;
    description?: string;
    photos?: string[];
    videoUrls?: string[];
  },
): Promise<{ error?: string; jar?: ProductJar }> {
  const name = input.name.trim();
  if (!name) return { error: "Indica un nombre para el jar." };

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from("product_jars")
    .update({
      name,
      description: input.description?.trim() || null,
      photos: input.photos ?? [],
      video_urls: input.videoUrls ?? [],
    })
    .eq("club_id", auth.clubId)
    .eq("id", jarId)
    .select("id, name, description, photos, video_urls, sort_order")
    .single();

  if (error) return { error: error.message };
  return { jar: toJar(data as JarRow) };
}

export async function deleteJarAction(
  jarId: string,
): Promise<{ error?: string }> {
  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const { count } = await auth.supabase
    .from("jar_items")
    .select("id", { count: "exact", head: true })
    .eq("club_id", auth.clubId)
    .eq("jar_id", jarId);

  if ((count ?? 0) > 0) {
    return { error: "Elimina primero los ítems de este jar." };
  }

  const { error } = await auth.supabase
    .from("product_jars")
    .delete()
    .eq("club_id", auth.clubId)
    .eq("id", jarId);

  if (error) return { error: error.message };
  return {};
}

export async function createJarItemAction(input: {
  jarId: string;
  name: string;
  description?: string;
  photos?: string[];
  videoUrls?: string[];
  pricePerUnit: number;
  compareAtPrice?: number | null;
  genetics?: ProductGenetics | null;
  thcPercent?: number | null;
  origin?: ProductOrigin | null;
}): Promise<{ error?: string; item?: JarItem }> {
  const name = input.name.trim();
  if (!name) return { error: "Indica un nombre para el ítem." };
  if (!(input.pricePerUnit >= 0)) return { error: "Precio inválido." };

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const baseId = jarItemIdFromName(input.jarId, name);
  const id = await uniqueJarItemId(auth.supabase, auth.clubId, baseId);

  const row = {
    id,
    club_id: auth.clubId,
    jar_id: input.jarId,
    name,
    description: input.description?.trim() || null,
    photos: input.photos ?? [],
    video_urls: input.videoUrls ?? [],
    price_per_unit: Math.round(input.pricePerUnit * 100) / 100,
    compare_at_price:
      input.compareAtPrice != null && input.compareAtPrice > input.pricePerUnit
        ? Math.round(input.compareAtPrice * 100) / 100
        : null,
    genetics: input.genetics ?? null,
    thc_percent: input.thcPercent ?? null,
    origin: input.origin ?? null,
  };

  const { data, error } = await auth.supabase
    .from("jar_items")
    .insert(row)
    .select(
      "id, jar_id, name, description, photos, video_urls, price_per_unit, compare_at_price, genetics, thc_percent, origin, sort_order",
    )
    .single();

  if (error) {
    if (isMissingJarsTable(error.message)) {
      return { error: "Ejecuta supabase/product-jars.sql en Supabase." };
    }
    return { error: error.message };
  }

  return { item: toJarItem(data as JarItemRow) };
}

export async function updateJarItemAction(
  jarItemId: string,
  input: {
    name: string;
    description?: string;
    photos?: string[];
    videoUrls?: string[];
    pricePerUnit: number;
    compareAtPrice?: number | null;
    genetics?: ProductGenetics | null;
    thcPercent?: number | null;
    origin?: ProductOrigin | null;
  },
): Promise<{ error?: string; item?: JarItem }> {
  const name = input.name.trim();
  if (!name) return { error: "Indica un nombre para el ítem." };

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from("jar_items")
    .update({
      name,
      description: input.description?.trim() || null,
      photos: input.photos ?? [],
      video_urls: input.videoUrls ?? [],
      price_per_unit: Math.round(input.pricePerUnit * 100) / 100,
      compare_at_price:
        input.compareAtPrice != null && input.compareAtPrice > input.pricePerUnit
          ? Math.round(input.compareAtPrice * 100) / 100
          : null,
      genetics: input.genetics ?? null,
      thc_percent: input.thcPercent ?? null,
      origin: input.origin ?? null,
    })
    .eq("club_id", auth.clubId)
    .eq("id", jarItemId)
    .select(
      "id, jar_id, name, description, photos, video_urls, price_per_unit, compare_at_price, genetics, thc_percent, origin, sort_order",
    )
    .single();

  if (error) return { error: error.message };
  return { item: toJarItem(data as JarItemRow) };
}

export async function deleteJarItemAction(
  jarItemId: string,
): Promise<{ error?: string }> {
  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const { count } = await auth.supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("club_id", auth.clubId)
    .eq("jar_item_id", jarItemId);

  if ((count ?? 0) > 0) {
    return {
      error: "Hay productos de inventario vinculados a este ítem.",
    };
  }

  const { error } = await auth.supabase
    .from("jar_items")
    .delete()
    .eq("club_id", auth.clubId)
    .eq("id", jarItemId);

  if (error) return { error: error.message };
  return {};
}
