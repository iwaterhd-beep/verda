"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cartItemGrams } from "@/lib/product-packs";
import { MAX_AVATAR_BYTES } from "@/lib/member-avatar";
import {
  friendlyAvatarError,
  uploadMemberAvatarBuffer,
} from "@/lib/member-avatar-server";
import {
  isAcceptedImageUpload,
  MAX_AVATAR_INPUT_BYTES,
  prepareAvatarImage,
} from "@/lib/image-server";
import type { CartItem, Order } from "@/types";

export interface PlaceOrderResult {
  error?: string;
  order?: Order;
}

function orderCode() {
  return `VRD-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function gramsOf(items: CartItem[]) {
  return items.reduce((a, i) => a + cartItemGrams(i), 0);
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
      error: "No puedes confirmar este pedido. Contacta con el club.",
    };
  }

  const wallet = Number(member.wallet_balance ?? 0);

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
      pack_items: i.packItems?.length ? i.packItems : null,
      grams_per_pack: i.gramsPerPack ?? null,
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

export async function uploadMemberAvatarAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const file = formData.get("avatar");
  if (
    !file ||
    typeof file === "string" ||
    !("size" in file) ||
    file.size === 0
  ) {
    return { error: "Selecciona una imagen." };
  }

  const imageFile = file as File;
  if (!isAcceptedImageUpload(imageFile)) {
    return { error: "El archivo debe ser una imagen." };
  }
  if (imageFile.size > MAX_AVATAR_INPUT_BYTES) {
    return { error: "La imagen no puede superar 20 MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No has iniciado sesión." };

  const { data: member, error: memberErr } = await supabase
    .from("members")
    .select("id, club_id")
    .eq("user_id", user.id)
    .single();
  if (memberErr || !member?.club_id) {
    return { error: "No encontramos tu ficha de socio." };
  }

  const admin = createAdminClient();
  const rawBuffer = Buffer.from(await imageFile.arrayBuffer());

  let buffer: Buffer;
  try {
    buffer = await prepareAvatarImage(rawBuffer);
  } catch {
    return {
      error:
        "No se pudo procesar la imagen. Prueba con otra foto en JPG o PNG.",
    };
  }

  if (buffer.length > MAX_AVATAR_BYTES) {
    return { error: "La imagen comprimida sigue siendo demasiado grande." };
  }

  const uploaded = await uploadMemberAvatarBuffer(
    admin,
    member.club_id,
    member.id,
    buffer,
    "image/jpeg",
  );
  if (uploaded.error || !uploaded.url) {
    return { error: uploaded.error ?? "No se pudo subir la foto." };
  }

  const { error: updateError } = await admin
    .from("members")
    .update({ avatar_url: uploaded.url })
    .eq("id", member.id);
  if (updateError) {
    return { error: friendlyAvatarError(updateError.message) };
  }

  return { url: `${uploaded.url}?v=${Date.now()}` };
}

export async function saveMemberAvatarAction(
  avatarUrl: string,
): Promise<{ error?: string }> {
  const trimmed = avatarUrl.trim();
  if (!trimmed) return { error: "URL de avatar no válida." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No has iniciado sesión." };

  const { data: member, error: memberErr } = await supabase
    .from("members")
    .select("id, club_id")
    .eq("user_id", user.id)
    .single();
  if (memberErr || !member?.club_id) {
    return { error: "No encontramos tu ficha de socio." };
  }

  const expectedPath = `${member.club_id}/${member.id}/`;
  if (!trimmed.includes(expectedPath)) {
    return { error: "La foto no pertenece a tu cuenta." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("members")
    .update({ avatar_url: trimmed.split("?")[0] })
    .eq("id", member.id);
  if (error) return { error: error.message };
  return {};
}
