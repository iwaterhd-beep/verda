import type { JarItem, ProductJar } from "@/types";

export function jarIdFromName(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 32);
  return base || "JAR";
}

export function jarItemIdFromName(jarId: string, name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24);
  return `${jarId}_${base || "ITEM"}`.slice(0, 48);
}

export function jarHasMedia(jar: Pick<ProductJar, "photos" | "videoUrls">) {
  return (jar.photos?.length ?? 0) > 0 || (jar.videoUrls?.length ?? 0) > 0;
}

export function jarItemHasMedia(item: Pick<JarItem, "photos" | "videoUrls">) {
  return (item.photos?.length ?? 0) > 0 || (item.videoUrls?.length ?? 0) > 0;
}
