import type { PackItem, ProductUnit } from "@/types";

export function gramsPerPack(items: PackItem[] | undefined): number {
  if (!items?.length) return 0;
  return items
    .filter((i) => i.unit === "g")
    .reduce((a, i) => a + i.qty, 0);
}

export function formatPackItemLine(item: PackItem): string {
  const qty =
    item.unit === "g"
      ? `${Number(item.qty) % 1 === 0 ? item.qty : item.qty.toFixed(2)}g`
      : `${item.qty} ud`;
  const name = item.productName?.trim();
  return name ? `${qty} ${name}` : qty;
}

export function formatPackContents(items: PackItem[] | undefined): string {
  if (!items?.length) return "";
  return items.map(formatPackItemLine).join(" + ");
}

export function unitLabel(unit: ProductUnit): string {
  if (unit === "pack") return "pack";
  if (unit === "ud") return "ud";
  return "g";
}

export function fmtLineQty(qty: number, unit: string) {
  if (unit === "pack") {
    const n = Number(qty);
    return n === 1 ? "1 pack" : `${n} packs`;
  }
  if (unit === "g") return `${Number(qty).toFixed(2)}g`;
  return `${qty} ud`;
}

export function cartItemGrams(item: {
  unit: ProductUnit;
  qty: number;
  gramsPerPack?: number;
}): number {
  if (item.unit === "g") return item.qty;
  if (item.unit === "pack") return (item.gramsPerPack ?? 0) * item.qty;
  return 0;
}
