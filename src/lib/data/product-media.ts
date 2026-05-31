"use client";

import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MAX_PRODUCT_VIDEOS,
  MAX_VIDEO_BYTES,
  isVideoFile,
  maxVideoSizeLabel,
} from "@/lib/product-media-limits";
import { storagePathFromPublicUrl } from "@/lib/product-media-storage";
import type { Product } from "@/types";

const BUCKET = "product-media";

type StaffAuth = { clubId: string; supabase: SupabaseClient };

let cachedStaffAuth: StaffAuth | null = null;
let cachedStaffAuthAt = 0;
const AUTH_CACHE_MS = 30_000;

async function staffClubId(): Promise<
  { clubId: string; supabase: SupabaseClient } | { error: string }
> {
  if (cachedStaffAuth && Date.now() - cachedStaffAuthAt < AUTH_CACHE_MS) {
    return cachedStaffAuth;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No has iniciado sesión." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.club_id || profile.role === "MEMBER") {
    return { error: "Sin permisos." };
  }

  cachedStaffAuth = { clubId: profile.club_id as string, supabase };
  cachedStaffAuthAt = Date.now();
  return cachedStaffAuth;
}

function uploadFileWithProgress(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ error?: string }> {
  return new Promise((resolve) => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        resolve({ error: "No has iniciado sesión." });
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const objectPath = path
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
      const url = `${baseUrl}/storage/v1/object/${bucket}/${objectPath}`;

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({});
          return;
        }
        try {
          const body = JSON.parse(xhr.responseText) as {
            message?: string;
            error?: string;
          };
          resolve({
            error: body.message || body.error || `Error al subir (${xhr.status})`,
          });
        } catch {
          resolve({ error: `Error al subir (${xhr.status})` });
        }
      };
      xhr.onerror = () => resolve({ error: "Error de red al subir el vídeo." });
      xhr.onabort = () => resolve({ error: "Subida cancelada." });

      xhr.open("POST", url);
      xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
      xhr.setRequestHeader("apikey", anonKey);
      xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
      xhr.setRequestHeader("Cache-Control", "3600");
      xhr.send(file);
    });
  });
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
  onProgress?: (pct: number) => void,
): Promise<{ url?: string; error?: string }> {
  if (!isVideoFile(file)) {
    return { error: "El archivo debe ser un vídeo (mp4, mov, webm…)." };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { error: `El vídeo no puede superar ${maxVideoSizeLabel()}.` };
  }

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${auth.clubId}/${productId}/video-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

  const { error: uploadError } = await uploadFileWithProgress(
    auth.supabase,
    BUCKET,
    path,
    file,
    onProgress,
  );

  if (uploadError) return { error: uploadError };

  const {
    data: { publicUrl },
  } = auth.supabase.storage.from(BUCKET).getPublicUrl(path);

  return { url: publicUrl };
}

/** Vídeos de farms/genéticas en product-media/{clubId}/{prefix}/... */
export async function uploadCatalogVideoClient(
  storagePrefix: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ url?: string; error?: string }> {
  if (!isVideoFile(file)) {
    return { error: "El archivo debe ser un vídeo (mp4, mov, webm…)." };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { error: `El vídeo no puede superar ${maxVideoSizeLabel()}.` };
  }

  const auth = await staffClubId();
  if ("error" in auth) return { error: auth.error };

  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${auth.clubId}/${storagePrefix}/video-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

  const { error: uploadError } = await uploadFileWithProgress(
    auth.supabase,
    BUCKET,
    path,
    file,
    onProgress,
  );

  if (uploadError) return { error: uploadError };

  const {
    data: { publicUrl },
  } = auth.supabase.storage.from(BUCKET).getPublicUrl(path);

  return { url: publicUrl };
}

export async function uploadCatalogVideosParallel(
  storagePrefix: string,
  files: File[],
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const result = await uploadCatalogVideoClient(storagePrefix, file);
    if (result.error) errors.push(result.error);
    else if (result.url) urls.push(result.url);
  }

  return { urls, errors };
}

export async function uploadProductVideosParallel(
  productId: string,
  files: File[],
  onProgress?: (completed: number, total: number) => void,
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];
  let completed = 0;

  await Promise.all(
    files.map(async (file) => {
      const result = await uploadProductVideoClient(productId, file);
      completed += 1;
      onProgress?.(completed, files.length);
      if (result.error) errors.push(result.error);
      else if (result.url) urls.push(result.url);
    }),
  );

  return { urls, errors };
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

export function clearStaffMediaAuthCache() {
  cachedStaffAuth = null;
  cachedStaffAuthAt = 0;
}
