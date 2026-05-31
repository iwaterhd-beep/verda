"use client";

import { createClient } from "@/lib/supabase/client";
import type { StaffNotificationSources } from "@/lib/staff-notifications";

function memberName(
  members: { full_name: string } | { full_name: string }[] | null,
) {
  if (!members) return "Socio";
  if (Array.isArray(members)) return members[0]?.full_name ?? "Socio";
  return members.full_name;
}

export async function fetchStaffNotificationSources(): Promise<StaffNotificationSources> {
  const supabase = createClient();

  const [appsRes, ordersRes, productsRes] = await Promise.all([
    supabase
      .from("member_applications")
      .select("id, full_name, submitted_at")
      .eq("status", "PENDING")
      .order("submitted_at", { ascending: false })
      .limit(15),
    supabase
      .from("orders")
      .select("id, code, status, created_at, members(full_name)")
      .in("status", ["PREPARING", "READY"])
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("products")
      .select("id, name, stock, low_stock_threshold")
      .order("name")
      .limit(200),
  ]);

  if (appsRes.error) throw appsRes.error;
  if (ordersRes.error) throw ordersRes.error;
  if (productsRes.error) throw productsRes.error;

  const lowStock = (productsRes.data ?? [])
    .filter((p) => Number(p.stock) < Number(p.low_stock_threshold))
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      name: p.name,
      stock: Number(p.stock),
      threshold: Number(p.low_stock_threshold),
    }));

  return {
    applications: (appsRes.data ?? []).map((a) => ({
      id: a.id,
      fullName: a.full_name,
      submittedAt: a.submitted_at,
    })),
    orders: (ordersRes.data ?? []).map((o) => ({
      id: o.id,
      code: o.code,
      status: o.status as "PREPARING" | "READY",
      memberName: memberName(o.members),
      createdAt: o.created_at,
    })),
    lowStock,
  };
}
