"use server";

import { createClient } from "@/lib/supabase/server";
import { farmIdFromName, geneticIdFromName } from "@/lib/product-farms";
import type { FarmGenetic, ProductFarm } from "@/types";
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

function isMissingFarmsTable(message: string) {
  return /product_farms|farm_genetics/i.test(message) &&
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

export async function listPortalFarmsAction(): Promise<{
  error?: string;
  farms?: ProductFarm[];
}> {
  const auth = await resolveAuthClubId();
  if ("error" in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from("product_farms")
    .select(
      "id, name, description, photos, video_urls, sort_order",
    )
    .eq("club_id", auth.clubId)
    .order("sort_order")
    .order("name");

  if (error) {
    if (isMissingFarmsTable(error.message)) {
      return {
        error: "Ejecuta supabase/product-farms.sql en Supabase.",
      };
    }
    return { error: error.message };
  }

  return { farms: (data as FarmRow[]).map(toFarm) };
}

export async function listPortalGeneticsAction(farmId?: string): Promise<{
  error?: string;
  genetics?: FarmGenetic[];
}> {
  const auth = await resolveAuthClubId();
  if ("error" in auth) return { error: auth.error };

  let query = auth.supabase
    .from("farm_genetics")
    .select(
      "id, farm_id, name, description, photos, video_urls, price_per_unit, compare_at_price, genetics, thc_percent, origin, sort_order",
    )
    .eq("club_id", auth.clubId)
    .order("sort_order")
    .order("name");

  if (farmId) query = query.eq("farm_id", farmId);

  const { data, error } = await query;
  if (error) {
    if (isMissingFarmsTable(error.message)) {
      return {
        error: "Ejecuta supabase/product-farms.sql en Supabase.",
      };
    }
    return { error: error.message };
  }

  return { genetics: (data as GeneticRow[]).map(toGenetic) };
}

async function uniqueFarmId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
  base: string,
) {
  let id = base;
  let n = 2;
  while (true) {
    const { data } = await supabase
      .from("product_farms")
      .select("id")
      .eq("club_id", clubId)
      .eq("id", id)
      .maybeSingle();
    if (!data) return id;
    id = `${base}_${n}`.slice(0, 32);
    n += 1;
  }
}

async function uniqueGeneticId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
  base: string,
) {
  let id = base;
  let n = 2;
  while (true) {
    const { data } = await supabase
      .from("farm_genetics")
      .select("id")
      .eq("club_id", clubId)
      .eq("id", id)
      .maybeSingle();
    if (!data) return id;
    id = `${base}_${n}`.slice(0, 48);
    n += 1;
  }
}

export async function createFarmAction(input: {
  name: string;
  description?: string;
  photos?: string[];
  videoUrls?: string[];
}): Promise<{ error?: string; farm?: ProductFarm }> {
  const name = input.name.trim();
  if (!name) return { error: "Indica un nombre para la farm." };

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const baseId = farmIdFromName(name);
  const id = await uniqueFarmId(auth.supabase, auth.clubId, baseId);

  const { data, error } = await auth.supabase
    .from("product_farms")
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
    if (isMissingFarmsTable(error.message)) {
      return { error: "Ejecuta supabase/product-farms.sql en Supabase." };
    }
    return { error: error.message };
  }

  return { farm: toFarm(data as FarmRow) };
}

export async function updateFarmAction(
  farmId: string,
  input: {
    name: string;
    description?: string;
    photos?: string[];
    videoUrls?: string[];
  },
): Promise<{ error?: string; farm?: ProductFarm }> {
  const name = input.name.trim();
  if (!name) return { error: "Indica un nombre para la farm." };

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from("product_farms")
    .update({
      name,
      description: input.description?.trim() || null,
      photos: input.photos ?? [],
      video_urls: input.videoUrls ?? [],
    })
    .eq("club_id", auth.clubId)
    .eq("id", farmId)
    .select("id, name, description, photos, video_urls, sort_order")
    .single();

  if (error) return { error: error.message };
  return { farm: toFarm(data as FarmRow) };
}

export async function deleteFarmAction(
  farmId: string,
): Promise<{ error?: string }> {
  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const { count } = await auth.supabase
    .from("farm_genetics")
    .select("id", { count: "exact", head: true })
    .eq("club_id", auth.clubId)
    .eq("farm_id", farmId);

  if ((count ?? 0) > 0) {
    return { error: "Elimina primero las genéticas de esta farm." };
  }

  const { error } = await auth.supabase
    .from("product_farms")
    .delete()
    .eq("club_id", auth.clubId)
    .eq("id", farmId);

  if (error) return { error: error.message };
  return {};
}

export async function createGeneticAction(input: {
  farmId: string;
  name: string;
  description?: string;
  photos?: string[];
  videoUrls?: string[];
  pricePerUnit: number;
  compareAtPrice?: number | null;
  genetics?: ProductGenetics | null;
  thcPercent?: number | null;
  origin?: ProductOrigin | null;
}): Promise<{ error?: string; genetic?: FarmGenetic }> {
  const name = input.name.trim();
  if (!name) return { error: "Indica un nombre para la genética." };
  if (!(input.pricePerUnit >= 0)) return { error: "Precio inválido." };

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const baseId = geneticIdFromName(input.farmId, name);
  const id = await uniqueGeneticId(auth.supabase, auth.clubId, baseId);

  const row = {
    id,
    club_id: auth.clubId,
    farm_id: input.farmId,
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
    .from("farm_genetics")
    .insert(row)
    .select(
      "id, farm_id, name, description, photos, video_urls, price_per_unit, compare_at_price, genetics, thc_percent, origin, sort_order",
    )
    .single();

  if (error) {
    if (isMissingFarmsTable(error.message)) {
      return { error: "Ejecuta supabase/product-farms.sql en Supabase." };
    }
    return { error: error.message };
  }

  return { genetic: toGenetic(data as GeneticRow) };
}

export async function updateGeneticAction(
  geneticId: string,
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
): Promise<{ error?: string; genetic?: FarmGenetic }> {
  const name = input.name.trim();
  if (!name) return { error: "Indica un nombre para la genética." };

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const { data, error } = await auth.supabase
    .from("farm_genetics")
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
    .eq("id", geneticId)
    .select(
      "id, farm_id, name, description, photos, video_urls, price_per_unit, compare_at_price, genetics, thc_percent, origin, sort_order",
    )
    .single();

  if (error) return { error: error.message };
  return { genetic: toGenetic(data as GeneticRow) };
}

export async function deleteGeneticAction(
  geneticId: string,
): Promise<{ error?: string }> {
  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const { count } = await auth.supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("club_id", auth.clubId)
    .eq("genetic_id", geneticId);

  if ((count ?? 0) > 0) {
    return {
      error: "Hay productos de inventario vinculados a esta genética.",
    };
  }

  const { error } = await auth.supabase
    .from("farm_genetics")
    .delete()
    .eq("club_id", auth.clubId)
    .eq("id", geneticId);

  if (error) return { error: error.message };
  return {};
}
