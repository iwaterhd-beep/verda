type MediaLike = {
  photos?: string[];
  videoUrls?: string[];
};

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

export function catalogEntryHasMedia(
  primary: MediaLike,
  parent?: MediaLike | null,
): boolean {
  const { photos, videoUrls } = resolveCatalogMedia(primary, parent);
  return photos.length > 0 || videoUrls.length > 0;
}

export function applyCatalogMediaToProduct<T extends MediaLike>(
  product: T,
  primary: MediaLike,
  parent?: MediaLike | null,
): T {
  const { photos, videoUrls } = resolveCatalogMedia(primary, parent);
  if (!photos.length && !videoUrls.length) return product;
  return {
    ...product,
    photos: photos.length ? photos : product.photos,
    videoUrls: videoUrls.length ? videoUrls : product.videoUrls,
  };
}
