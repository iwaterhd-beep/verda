import sharp from "sharp";

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "gif",
  "avif",
]);

export const MAX_AVATAR_INPUT_BYTES = 20 * 1024 * 1024;

export function isAcceptedImageUpload(file: {
  type: string;
  name: string;
}): boolean {
  if (file.type.startsWith("image/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext ? IMAGE_EXTENSIONS.has(ext) : false;
}

/** Resize, auto-rotate and compress to JPEG — works with HEIC and large phone photos. */
export async function prepareAvatarImage(input: Buffer): Promise<Buffer> {
  return sharp(input, { failOn: "none" })
    .rotate()
    .resize(800, 800, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}
