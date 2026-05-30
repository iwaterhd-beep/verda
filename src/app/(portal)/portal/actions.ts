"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { CartItem, Order } from "@/types";

export interface PlaceOrderResult {
  error?: string;
  order?: Order;
}

function orderCode() {
  return `VRD-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function gramsOf(items: CartItem[]) {
  return items
    .filter((i) => i.unit === "g")
    .reduce((a, i) => a + i.qty, 0);
}

export async function placeOrderAction(
  items: CartItem[],
  paymentMethod: Order["paymentMethod"],
): Promise<PlaceOrderResult> {
  if (!items.length) return { error: "El carrito está vacío." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión para confirmar el pedido." };

  const { data: member, error: memberErr } = await supabase
    .from("members")
    .select("id, club_id, wallet_balance, consumption_limit, consumed_this_month")
    .eq("user_id", user.id)
    .single();
  if (memberErr || !member) {
    return { error: "No encontramos tu ficha de socio." };
  }

  const total = Math.round(
    items.reduce((a, i) => a + i.qty * i.pricePerUnit, 0) * 100,
  ) / 100;
  const grams = gramsOf(items);
  const limit = Number(member.consumption_limit ?? 40);
  const consumed = Number(member.consumed_this_month ?? 0);
  const remaining = limit - consumed;

  if (grams > remaining) {
    return {
      error: `Superas tu límite mensual. Te quedan ${remaining}g disponibles.`,
    };
  }

  const wallet = Number(member.wallet_balance ?? 0);
  if (paymentMethod === "WALLET" && total > wallet) {
    return { error: "Saldo insuficiente en el monedero." };
  }

  const admin = createAdminClient();
  const code = orderCode();

  const { data: orderRow, error: orderErr } = await admin
    .from("orders")
    .insert({
      club_id: member.club_id,
      member_id: member.id,
      code,
      total,
      grams,
      payment_method: paymentMethod,
      status: "PREPARING",
    })
    .select("id, code, total, grams, payment_method, status, created_at")
    .single();
  if (orderErr || !orderRow) {
    return { error: orderErr?.message ?? "No se pudo crear el pedido." };
  }

  const { error: itemsErr } = await admin.from("order_items").insert(
    items.map((i) => ({
      order_id: orderRow.id,
      product_id: i.productId,
      name: i.name,
      category: i.category,
      unit: i.unit,
      price_per_unit: i.pricePerUnit,
      qty: i.qty,
    })),
  );
  if (itemsErr) {
    await admin.from("orders").delete().eq("id", orderRow.id);
    return { error: itemsErr.message };
  }

  if (paymentMethod === "WALLET") {
    const balanceAfter = Math.round((wallet - total) * 100) / 100;
    const { error: walletErr } = await admin
      .from("members")
      .update({ wallet_balance: balanceAfter })
      .eq("id", member.id);
    if (walletErr) {
      await admin.from("orders").delete().eq("id", orderRow.id);
      return { error: walletErr.message };
    }
    await admin.from("wallet_movements").insert({
      member_id: member.id,
      amount: -total,
      type: "PURCHASE",
      reason: `Pedido ${code}`,
      balance_after: balanceAfter,
    });
  }

  if (grams > 0) {
    await admin
      .from("members")
      .update({ consumed_this_month: consumed + grams })
      .eq("id", member.id);
  }

  const { data: savedItems } = await admin
    .from("order_items")
    .select("id, product_id, name, category, unit, price_per_unit, qty")
    .eq("order_id", orderRow.id);

  return {
    order: {
      id: orderRow.id,
      code: orderRow.code,
      items: (savedItems ?? []).map((i) => ({
        id: i.id,
        productId: i.product_id,
        name: i.name,
        category: i.category as CartItem["category"],
        unit: i.unit as CartItem["unit"],
        pricePerUnit: Number(i.price_per_unit),
        qty: Number(i.qty),
      })),
      total: Number(orderRow.total),
      grams: Number(orderRow.grams ?? 0),
      paymentMethod: orderRow.payment_method as Order["paymentMethod"],
      status: orderRow.status as Order["status"],
      createdAt: orderRow.created_at,
    },
  };
}

export async function changePasswordAction(
  password: string,
): Promise<{ error?: string }> {
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return {};
}
