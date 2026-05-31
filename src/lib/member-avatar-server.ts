import type { SupabaseClient } from "@supabase/supabase-js";
import { MEMBER_AVATAR_BUCKET, memberAvatarStoragePath } from "@/lib/member-avatar";

export async function uploadMemberAvatarFromDataUrl(
  admin: SupabaseClient,
  clubId: string,
  memberId: string,
  dataUrl: string | null | undefined,
): Promise<string | null> {
  if (!dataUrl?.startsWith("data:")) return null;

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const ext = mime.includes("png") ? "png" : "jpg";
  const path = memberAvatarStoragePath(clubId, memberId, ext);

  const { error } = await admin.storage
    .from(MEMBER_AVATAR_BUCKET)
    .upload(path, buffer, { upsert: true, contentType: mime });

  if (error) return null;

  const {
    data: { publicUrl },
  } = admin.storage.from(MEMBER_AVATAR_BUCKET).getPublicUrl(path);

  return publicUrl;
}
