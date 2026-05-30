"use client";

import { createClient } from "@/lib/supabase/client";
import type { CartItem, ClubOrder, Order, OrderLineItem, OrderStatus } from "@/types";

type ItemRow = {
  id: string;
  product_id: string;
  name: string;
  category: string;
  unit: string;
  price_per_unit: number;
  qty: number;
  actual_qty: number | null;
};

type OrderRow = {
  id: string;
  code: string;
  total: number;
  grams: number | null;
  payment_method: string;
  status: OrderStatus;
  created_at: string;
  member_id: string;
  members: { full_name: string } | { full_name: string }[] | null;
  order_items: ItemRow[];
};

function toLineItem(i: ItemRow): OrderLineItem {
  return {
    id: i.id,
    productId: i.product_id,
    name: i.name,
    category: i.category as CartItem["category"],
    unit: i.unit as CartItem["unit"],
    pricePerUnit: Number(i.price_per_unit),
    qty: Number(i.qty),
    actualQty: i.actual_qty != null ? Number(i.actual_qty) : null,
  };
}

function toOrder(r: OrderRow): Order {
  return {
    id: r.id,
    code: r.code,
    items: (r.order_items ?? []).map(toLineItem),
    total: Number(r.total),
    grams: Number(r.grams ?? 0),
    paymentMethod: r.payment_method as Order["paymentMethod"],
    status: r.status,
    createdAt: r.created_at,
  };
}

const itemFields =
  "id, product_id, name, category, unit, price_per_unit, qty, actual_qty";

export async function fetchMyOrders(): Promise<Order[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, code, total, grams, payment_method, status, created_at, order_items(${itemFields})`,
    )
    .eq("member_id", member.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as OrderRow[]).map(toOrder);
}

function memberName(members: OrderRow["members"]): string {
  if (!members) return "Socio";
  if (Array.isArray(members)) return members[0]?.full_name ?? "Socio";
  return members.full_name;
}

function toClubOrder(r: OrderRow): ClubOrder {
  return {
    ...toOrder(r),
    memberId: r.member_id,
    memberName: memberName(r.members),
  };
}

export async function fetchClubOrders(): Promise<ClubOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, code, total, grams, payment_method, status, created_at, member_id, members(full_name), order_items(${itemFields})`,
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as OrderRow[]).map(toClubOrder);
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const supabase = createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export function fmtLineQty(qty: number, unit: string) {
  return unit === "g" ? `${Number(qty).toFixed(2)}g` : `${qty} ud`;
}
