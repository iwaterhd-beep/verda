"use client";

import { createClient } from "@/lib/supabase/client";
import { fileToCompressedDataUrl } from "@/lib/image";

export const MEMBER_AVATAR_BUCKET = "member-avatars";
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export function memberAvatarStoragePath(
  clubId: string,
  memberId: string,
  ext = "jpg",
) {
  return `${clubId}/${memberId}/avatar.${ext}`;
}

export async function uploadMemberAvatarClient(
  file: File,
): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith("image/")) {
    return { error: "El archivo debe ser una imagen." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "La imagen no puede superar 5 MB." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No has iniciado sesión." };

  const { data: member, error: memberErr } = await supabase
    .from("members")
    .select("id, club_id")
    .eq("user_id", user.id)
    .single();
  if (memberErr || !member?.club_id) {
    return { error: "No encontramos tu ficha de socio." };
  }

  const dataUrl = await fileToCompressedDataUrl(file, 800, 0.82);
  const blob = await fetch(dataUrl).then((r) => r.blob());
  const path = memberAvatarStoragePath(member.club_id, member.id);

  const { error: uploadError } = await supabase.storage
    .from(MEMBER_AVATAR_BUCKET)
    .upload(path, blob, { upsert: true, contentType: "image/jpeg" });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(MEMBER_AVATAR_BUCKET).getPublicUrl(path);

  return { url: `${publicUrl}?v=${Date.now()}` };
}
