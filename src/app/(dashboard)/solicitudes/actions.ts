"use server";

import { randomBytes } from "node:crypto";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface ApproveResult {
  error?: string;
  email?: string;
  password?: string;
}

function tempPassword() {
  // 9 caracteres legibles + dígitos para cumplir requisitos.
  return randomBytes(6).toString("base64url").slice(0, 9) + "7a";
}

export async function approveApplicationAction(
  appId: string,
): Promise<ApproveResult> {
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
    return { error: "No tienes permisos para aprobar solicitudes." };
  }
  const clubId = profile.club_id as string | null;

  const { data: app, error: appErr } = await supabase
    .from("member_applications")
    .select("*")
    .eq("id", appId)
    .single();
  if (appErr || !app) return { error: "Solicitud no encontrada." };
  if (!app.email) return { error: "La solicitud no tiene email." };

  const admin = createAdminClient();
  const password = tempPassword();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: app.email,
    password,
    email_confirm: true,
    user_metadata: { name: app.full_name, club_id: clubId, role: "MEMBER" },
  });

  if (createErr || !created?.user) {
    const already = createErr?.message?.toLowerCase().includes("already");
    return {
      error: already
        ? "Ya existe una cuenta con ese email."
        : createErr?.message ?? "No se pudo crear la cuenta del socio.",
    };
  }

  const userId = created.user.id;

  const { error: memberErr } = await admin.from("members").insert({
    club_id: clubId,
    user_id: userId,
    full_name: app.full_name,
    email: app.email,
    phone: app.phone,
    document_id: app.document_id,
    birth_date: app.birth_date,
    locality: app.locality,
    address: app.address,
    status: "ACTIVE",
    plan: "BASIC",
    qr_code: `VRD-${Math.floor(Math.random() * 9000 + 1000)}`,
    age_verified: true,
    expires_at: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10),
  });

  if (memberErr) {
    // Revertir la cuenta creada para no dejar huérfanos.
    await admin.auth.admin.deleteUser(userId);
    return { error: memberErr.message };
  }

  const { error: updErr } = await admin
    .from("member_applications")
    .update({ status: "APPROVED", reviewed_at: new Date().toISOString() })
    .eq("id", appId);
  if (updErr) return { error: updErr.message };

  // Asegura perfil MEMBER aunque el trigger de Supabase esté desactualizado.
  await admin.from("profiles").upsert({
    id: userId,
    club_id: clubId,
    name: app.full_name,
    email: app.email,
    role: "MEMBER",
  });

  return { email: app.email, password };
}
