"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { defaultCatalog } from "@/lib/catalog";

export interface ReadyLineInput {
  itemId: string;
  actualQty: number;
}

export interface MarkReadyResult {
  error?: string;
  refunded?: number;
}

async function ensureClubProducts(clubId: string, admin: ReturnType<typeof createAdminClient>) {
  const { data: existing } = await admin
    .from("products")
    .select("id")
    .eq("club_id", clubId);
  const have = new Set((existing ?? []).map((r) => r.id));
  const missing = defaultCatalog.filter((p) => !have.has(p.id));
  if (!missing.length) return;

  await admin.from("products").insert(
    missing.map((p) => ({
      id: p.id,
      club_id: clubId,
      name: p.name,
      category: p.category,
      sku: p.sku,
      stock: p.stock,
      unit: p.unit,
      low_stock_threshold: p.lowStockThreshold,
      price_per_unit: p.pricePerUnit,
      batch: p.batch === "—" ? null : p.batch,
      expires_at: p.expiresAt,
    })),
  );
}

export async function markOrderReadyAction(
  orderId: string,
  lines: ReadyLineInput[],
): Promise<MarkReadyResult> {
  if (!lines.length) return { error: "Indica el peso real de cada producto." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No has iniciado sesión." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role === "MEMBER") {
    return { error: "No tienes permisos." };
  }
  const clubId = profile.club_id as string;
  const admin = createAdminClient();

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, club_id, status")
    .eq("id", orderId)
    .single();
  if (orderErr || !order) return { error: "Pedido no encontrado." };
  if (order.club_id !== clubId) return { error: "Pedido de otro club." };
  if (order.status !== "PREPARING") {
    return { error: "Este pedido ya no está en preparación." };
  }

  const { data: items, error: itemsErr } = await admin
    .from("order_items")
    .select("id, product_id, unit, qty")
    .eq("order_id", orderId);
  if (itemsErr || !items?.length) return { error: "Líneas del pedido no encontradas." };

  const byId = new Map(items.map((i) => [i.id, i]));
  for (const line of lines) {
    if (!byId.has(line.itemId)) return { error: "Línea de pedido no válida." };
    if (!(line.actualQty > 0)) {
      return { error: "El peso real debe ser mayor que 0." };
    }
  }

  await ensureClubProducts(clubId, admin);

  let gramsServed = 0;

  for (const line of lines) {
    const item = byId.get(line.itemId)!;
    const actual = Math.round(line.actualQty * 100) / 100;

    const { error: updErr } = await admin
      .from("order_items")
      .update({ actual_qty: actual })
      .eq("id", line.itemId);
    if (updErr) return { error: updErr.message };

    const { data: product, error: prodErr } = await admin
      .from("products")
      .select("stock")
      .eq("club_id", clubId)
      .eq("id", item.product_id)
      .single();
    if (prodErr || !product) {
      return { error: `Producto ${item.product_id} no encontrado en inventario.` };
    }

    const stock = Number(product.stock);
    if (actual > stock) {
      return {
        error: `Stock insuficiente para ${item.product_id}. Disponible: ${stock}${item.unit}.`,
      };
    }

    const newStock = Math.round((stock - actual) * 100) / 100;
    const { error: stockErr } = await admin
      .from("products")
      .update({ stock: newStock })
      .eq("club_id", clubId)
      .eq("id", item.product_id);
    if (stockErr) return { error: stockErr.message };

    if (item.unit === "g") gramsServed += actual;
  }

  const { error: statusErr } = await admin
    .from("orders")
    .update({ status: "READY", grams: gramsServed })
    .eq("id", orderId);
  if (statusErr) return { error: statusErr.message };

  return {};
}

export async function cancelOrderAction(
  orderId: string,
): Promise<MarkReadyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No has iniciado sesión." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role === "MEMBER") {
    return { error: "No tienes permisos." };
  }
  const clubId = profile.club_id as string;
  const admin = createAdminClient();

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, club_id, member_id, status, payment_method, total, code, grams")
    .eq("id", orderId)
    .single();
  if (orderErr || !order) return { error: "Pedido no encontrado." };
  if (order.club_id !== clubId) return { error: "Pedido de otro club." };
  if (order.status === "COMPLETED") {
    return { error: "No se puede cancelar un pedido ya entregado." };
  }
  if (order.status === "CANCELLED") {
    return { error: "Este pedido ya está cancelado." };
  }

  let refunded: number | undefined;

  if (order.payment_method === "WALLET") {
    const total = Number(order.total);
    const { data: member, error: memberErr } = await admin
      .from("members")
      .select("wallet_balance")
      .eq("id", order.member_id)
      .single();
    if (memberErr || !member) {
      return { error: "No se encontró el socio del pedido." };
    }

    const balanceAfter =
      Math.round((Number(member.wallet_balance) + total) * 100) / 100;
    const { error: walletErr } = await admin
      .from("members")
      .update({ wallet_balance: balanceAfter })
      .eq("id", order.member_id);
    if (walletErr) return { error: walletErr.message };

    const { error: movErr } = await admin.from("wallet_movements").insert({
      member_id: order.member_id,
      amount: total,
      type: "ADJUST",
      reason: `Reembolso pedido ${order.code}`,
      balance_after: balanceAfter,
    });
    if (movErr) return { error: movErr.message };

    refunded = total;
  }

  const grams = Number(order.grams ?? 0);
  if (grams > 0) {
    const { data: member } = await admin
      .from("members")
      .select("consumed_this_month")
      .eq("id", order.member_id)
      .single();
    if (member) {
      const consumed = Number(member.consumed_this_month ?? 0);
      const restored = Math.max(0, Math.round((consumed - grams) * 100) / 100);
      await admin
        .from("members")
        .update({ consumed_this_month: restored })
        .eq("id", order.member_id);
    }
  }

  // Si ya se pesó y descontó stock, devolverlo al inventario.
  if (order.status === "READY") {
    const { data: items } = await admin
      .from("order_items")
      .select("product_id, actual_qty")
      .eq("order_id", orderId);

    for (const item of items ?? []) {
      if (item.actual_qty == null) continue;
      const qty = Number(item.actual_qty);
      const { data: product } = await admin
        .from("products")
        .select("stock")
        .eq("club_id", clubId)
        .eq("id", item.product_id)
        .single();
      if (product) {
        const restored = Math.round((Number(product.stock) + qty) * 100) / 100;
        await admin
          .from("products")
          .update({ stock: restored })
          .eq("club_id", clubId)
          .eq("id", item.product_id);
      }
    }
  }

  const { error: statusErr } = await admin
    .from("orders")
    .update({ status: "CANCELLED" })
    .eq("id", orderId);
  if (statusErr) return { error: statusErr.message };

  return { refunded };
}
