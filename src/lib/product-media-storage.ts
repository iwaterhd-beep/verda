const BUCKET = "product-media";

export function storagePathFromPublicUrl(url: string): string | null {
  if (!url.startsWith("http")) return null;
  const marker = `/object/public/${BUCKET}/`;
  const altMarker = `/${BUCKET}/`;
  let idx = url.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
  }
  idx = url.indexOf(altMarker);
  if (idx !== -1) {
    return decodeURIComponent(url.slice(idx + altMarker.length).split("?")[0]);
  }
  return null;
}

export function collectProductStoragePaths(
  photos: string[] = [],
  videoUrls: string[] = [],
): string[] {
  const paths = new Set<string>();
  for (const url of [...photos, ...videoUrls]) {
    const path = storagePathFromPublicUrl(url);
    if (path) paths.add(path);
  }
  return [...paths];
}
