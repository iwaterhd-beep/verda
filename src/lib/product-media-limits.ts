export const MAX_PRODUCT_PHOTOS = 8;
export const MAX_PRODUCT_VIDEOS = 4;
export const MAX_VIDEO_MB = 500;
export const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export function maxVideoSizeLabel() {
  return `${MAX_VIDEO_MB} MB`;
}

const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "webm",
  "mov",
  "m4v",
  "avi",
  "mkv",
  "ogv",
]);

export function isVideoFile(file: File) {
  if (file.type.startsWith("video/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext ? VIDEO_EXTENSIONS.has(ext) : false;
}
