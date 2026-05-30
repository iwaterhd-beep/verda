"use client";

import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-media";
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

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

export async function uploadProductVideoClient(
  productId: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith("video/")) {
    return { error: "El archivo debe ser un vídeo." };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { error: "El vídeo no puede superar 25 MB." };
  }

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${auth.clubId}/${productId}/video.${ext}`;

  const { error: uploadError } = await auth.supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = auth.supabase.storage.from(BUCKET).getPublicUrl(path);

  const { error: updateError } = await auth.supabase
    .from("products")
    .update({ video_url: publicUrl })
    .eq("club_id", auth.clubId)
    .eq("id", productId);

  if (updateError) return { error: updateError.message };
  return { url: publicUrl };
}

export async function removeProductVideoClient(
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

  const { error: updateError } = await auth.supabase
    .from("products")
    .update({ video_url: null })
    .eq("club_id", auth.clubId)
    .eq("id", productId);

  if (updateError) return { error: updateError.message };

  if (product?.video_url) {
    const marker = `/object/public/${BUCKET}/`;
    const altMarker = `/${BUCKET}/`;
    let storagePath: string | null = null;
    const idx = product.video_url.indexOf(marker);
    if (idx !== -1) {
      storagePath = decodeURIComponent(
        product.video_url.slice(idx + marker.length).split("?")[0],
      );
    } else {
      const idx2 = product.video_url.indexOf(altMarker);
      if (idx2 !== -1) {
        storagePath = decodeURIComponent(
          product.video_url.slice(idx2 + altMarker.length).split("?")[0],
        );
      }
    }
    if (storagePath) {
      await auth.supabase.storage.from(BUCKET).remove([storagePath]);
    }
  }

  return {};
}
