import type { FarmGenetic, ProductFarm } from "@/types";

export function farmIdFromName(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 32);
  return base || "FARM";
}

export function geneticIdFromName(farmId: string, name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24);
  return `${farmId}_${base || "GENETIC"}`.slice(0, 48);
}

export function farmHasMedia(farm: Pick<ProductFarm, "photos" | "videoUrls">) {
  return (farm.photos?.length ?? 0) > 0 || (farm.videoUrls?.length ?? 0) > 0;
}

export function geneticHasMedia(
  genetic: Pick<FarmGenetic, "photos" | "videoUrls">,
) {
  return (genetic.photos?.length ?? 0) > 0 || (genetic.videoUrls?.length ?? 0) > 0;
}

export function geneticVideoUrls(
  genetic: Pick<FarmGenetic, "videoUrls">,
): string[] {
  return genetic.videoUrls ?? [];
}
