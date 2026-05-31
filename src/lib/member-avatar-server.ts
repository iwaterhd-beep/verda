import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MEMBER_AVATAR_BUCKET,
  MAX_AVATAR_BYTES,
  friendlyAvatarError,
  memberAvatarStoragePath,
} from "@/lib/member-avatar";

export { friendlyAvatarError };

export async function ensureMemberAvatarBucket(
  admin: SupabaseClient,
): Promise<string | null> {
  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) return listError.message;

  if (buckets?.some((bucket) => bucket.id === MEMBER_AVATAR_BUCKET)) {
    return null;
  }

  const { error: createError } = await admin.storage.createBucket(
    MEMBER_AVATAR_BUCKET,
    {
      public: true,
      fileSizeLimit: MAX_AVATAR_BYTES,
    },
  );

  if (createError && !/already exists/i.test(createError.message)) {
    return createError.message;
  }

  return null;
}

export async function uploadMemberAvatarBuffer(
  admin: SupabaseClient,
  clubId: string,
  memberId: string,
  buffer: Buffer,
  contentType = "image/jpeg",
): Promise<{ url?: string; error?: string }> {
  const bucketError = await ensureMemberAvatarBucket(admin);
  if (bucketError) return { error: friendlyAvatarError(bucketError) };

  const ext = contentType.includes("png") ? "png" : "jpg";
  const path = memberAvatarStoragePath(clubId, memberId, ext);

  const { error: uploadError } = await admin.storage
    .from(MEMBER_AVATAR_BUCKET)
    .upload(path, buffer, { upsert: true, contentType });

  if (uploadError) return { error: friendlyAvatarError(uploadError.message) };

  const {
    data: { publicUrl },
  } = admin.storage.from(MEMBER_AVATAR_BUCKET).getPublicUrl(path);

  return { url: publicUrl };
}

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
  const result = await uploadMemberAvatarBuffer(admin, clubId, memberId, buffer, mime);
  return result.url ?? null;
}
