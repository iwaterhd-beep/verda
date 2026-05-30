"use client";

import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types";

type Row = {
  id: string;
  name: string;
  category: string;
  sku: string | null;
  stock: number;
  unit: string;
  low_stock_threshold: number;
  price_per_unit: number;
  batch: string | null;
  expires_at: string | null;
};

function toProduct(r: Row): Product {
  return {
    id: r.id,
    name: r.name,
    category: r.category as Product["category"],
    sku: r.sku ?? "",
    stock: Number(r.stock),
    unit: r.unit as Product["unit"],
    lowStockThreshold: Number(r.low_stock_threshold),
    pricePerUnit: Number(r.price_per_unit),
    batch: r.batch ?? "—",
    expiresAt: r.expires_at,
  };
}

export async function fetchClubProducts(): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data as Row[]).map(toProduct);
}
