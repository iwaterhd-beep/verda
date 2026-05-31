"use client";

import { createClient } from "@/lib/supabase/client";
import {
  MAX_PRODUCT_VIDEOS,
  MAX_VIDEO_BYTES,
  maxVideoSizeLabel,
} from "@/lib/product-media-limits";
import { storagePathFromPublicUrl } from "@/lib/product-media-storage";
import type { Product } from "@/types";

const BUCKET = "product-media";

async function staffClubId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No has iniciado sesión." as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.club_id || profile.role === "MEMBER") {
    return { error: "Sin permisos." as const };
  }

  return { clubId: profile.club_id as string, supabase };
}

export function productVideoUrls(
  product: Pick<Product, "videoUrls" | "videoUrl">,
): string[] {
  if (product.videoUrls?.length) return product.videoUrls;
  if (product.videoUrl) return [product.videoUrl];
  return [];
}

export function productPhotos(product: Pick<Product, "photos">): string[] {
  return product.photos ?? [];
}

export function productHasMedia(product: Product) {
  return productPhotos(product).length > 0 || productVideoUrls(product).length > 0;
}

export async function uploadProductVideoClient(
  productId: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith("video/")) {
    return { error: "El archivo debe ser un vídeo." };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { error: `El vídeo no puede superar ${maxVideoSizeLabel()}.` };
  }

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${auth.clubId}/${productId}/video-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

  const { error: uploadError } = await auth.supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || "video/mp4" });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = auth.supabase.storage.from(BUCKET).getPublicUrl(path);

  return { url: publicUrl };
}

export async function removeStorageFileClient(
  url: string,
): Promise<{ error?: string }> {
  const path = storagePathFromPublicUrl(url);
  if (!path) return {};

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const { error } = await auth.supabase.storage.from(BUCKET).remove([path]);
  if (error) return { error: error.message };
  return {};
}

export async function syncProductMediaClient(
  productId: string,
  photos: string[],
  videoUrls: string[],
): Promise<{ error?: string }> {
  if (videoUrls.length > MAX_PRODUCT_VIDEOS) {
    return { error: `Máximo ${MAX_PRODUCT_VIDEOS} vídeos por producto.` };
  }

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const payload: Record<string, unknown> = {
    photos,
    video_urls: videoUrls,
    video_url: videoUrls[0] ?? null,
  };

  let { error } = await auth.supabase
    .from("products")
    .update(payload)
    .eq("club_id", auth.clubId)
    .eq("id", productId);

  if (error && /video_urls/i.test(error.message)) {
    ({ error } = await auth.supabase
      .from("products")
      .update({ photos, video_url: videoUrls[0] ?? null })
      .eq("club_id", auth.clubId)
      .eq("id", productId));
  }

  if (error) return { error: error.message };
  return {};
}
