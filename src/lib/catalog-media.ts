type MediaLike = {
  photos?: string[];
  videoUrls?: string[];
};

function firstVideos(...sources: (MediaLike | null | undefined)[]): string[] {
  for (const source of sources) {
    const urls = source?.videoUrls ?? [];
    if (urls.length) return urls;
  }
  return [];
}

function firstPhotos(...sources: (MediaLike | null | undefined)[]): string[] {
  for (const source of sources) {
    const photos = source?.photos ?? [];
    if (photos.length) return photos;
  }
  return [];
}

/** Fotos/vídeos del ítem de catálogo, con fallback al contenedor padre (farm/jar). */
export function resolveCatalogMedia(
  primary: MediaLike,
  parent?: MediaLike | null,
): { photos: string[]; videoUrls: string[] } {
  const photos =
    primary.photos?.length ? primary.photos : (parent?.photos ?? []);
  const videoUrls =
    primary.videoUrls?.length ? primary.videoUrls : (parent?.videoUrls ?? []);
  return { photos, videoUrls };
}

/**
 * Media unificada para productos vinculados.
 * Vídeo: producto > genética/ítem > farm/jar.
 * Foto: solo si no hay vídeo en ningún nivel (igual que el thumb del inventario).
 */
export function resolveProductMedia(
  product: MediaLike | null | undefined,
  primary: MediaLike,
  parent?: MediaLike | null,
): { photos: string[]; videoUrls: string[] } {
  const videoUrls = firstVideos(product, primary, parent);
  if (videoUrls.length) {
    return { photos: [], videoUrls };
  }
  const photos = firstPhotos(product, primary, parent);
  return { photos, videoUrls: [] };
}

export function mediaThumbFromLike(media: MediaLike): {
  type: "video" | "photo" | null;
  url: string | null;
} {
  const videos = media.videoUrls ?? [];
  if (videos[0]) return { type: "video", url: videos[0] };
  const photos = media.photos ?? [];
  if (photos[0]) return { type: "photo", url: photos[0] };
  return { type: null, url: null };
}

export function catalogEntryHasMedia(
  primary: MediaLike,
  parent?: MediaLike | null,
  product?: MediaLike | null,
): boolean {
  const { photos, videoUrls } = resolveProductMedia(product, primary, parent);
  return photos.length > 0 || videoUrls.length > 0;
}

export function applyCatalogMediaToProduct<T extends MediaLike>(
  product: T,
  primary: MediaLike,
  parent?: MediaLike | null,
): T {
  const { photos, videoUrls } = resolveProductMedia(product, primary, parent);
  if (
    photos === product.photos &&
    videoUrls === product.videoUrls &&
    !photos.length &&
    !videoUrls.length
  ) {
    return product;
  }
  return {
    ...product,
    photos,
    videoUrls,
  };
}
