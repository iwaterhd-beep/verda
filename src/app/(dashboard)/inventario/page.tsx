import type { Metadata } from "next";
import { InventarioClient } from "./inventario-client";

export const metadata: Metadata = { title: "Inventario" };

export default function InventarioPage() {
  return <InventarioClient />;
}
