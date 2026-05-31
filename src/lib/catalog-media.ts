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

/** Producto propio > genética/ítem > farm/jar. */
export function resolveProductMedia(
  product: MediaLike | null | undefined,
  primary: MediaLike,
  parent?: MediaLike | null,
): { photos: string[]; videoUrls: string[] } {
  const catalog = resolveCatalogMedia(primary, parent);
  const productPhotos = product?.photos ?? [];
  const productVideos = product?.videoUrls ?? [];
  return {
    photos: productPhotos.length ? productPhotos : catalog.photos,
    videoUrls: productVideos.length ? productVideos : catalog.videoUrls,
  };
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
  const nextPhotos = product.photos?.length ? product.photos : photos;
  const nextVideos = product.videoUrls?.length ? product.videoUrls : videoUrls;
  if (
    nextPhotos === product.photos &&
    nextVideos === product.videoUrls &&
    !photos.length &&
    !videoUrls.length
  ) {
    return product;
  }
  return {
    ...product,
    photos: nextPhotos,
    videoUrls: nextVideos,
  };
}
