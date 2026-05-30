export const MAX_PRODUCT_PHOTOS = 8;
export const MAX_PRODUCT_VIDEOS = 4;
/** Tamaño máximo del vídeo ya comprimido antes de subirlo. */
export const MAX_VIDEO_MB = 100;
export const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export function maxVideoSizeLabel() {
  return `${MAX_VIDEO_MB} MB`;
}
