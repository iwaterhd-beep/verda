"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateTempPassword } from "@/lib/auth/temp-password";

export interface CreateMemberAccountInput {
  fullName: string;
  email: string;
  phone?: string;
  documentId?: string;
  birthDate?: string;
  plan?: "BASIC" | "PREMIUM" | "VIP";
}

export interface CreateMemberAccountResult {
  error?: string;
  email?: string;
  password?: string;
  memberId?: string;
}

const planLimits: Record<string, number> = { BASIC: 40, PREMIUM: 60, VIP: 100 };

export async function createMemberWithAccountAction(
  input: CreateMemberAccountInput,
): Promise<CreateMemberAccountResult> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  if (!fullName) return { error: "El nombre es obligatorio." };
  if (!email) return { error: "El email es obligatorio para crear acceso al portal." };

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
  if (!profile || profile.role === "MEMBER" || !profile.club_id) {
    return { error: "No tienes permisos." };
  }

  const clubId = profile.club_id as string;
  const plan = input.plan ?? "BASIC";
  const admin = createAdminClient();
  const password = generateTempPassword();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: fullName, club_id: clubId, role: "MEMBER" },
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

  const { data: member, error: memberErr } = await admin
    .from("members")
    .insert({
      club_id: clubId,
      user_id: userId,
      full_name: fullName,
      email,
      phone: input.phone?.trim() || null,
      document_id: input.documentId?.trim() || null,
      birth_date: input.birthDate || "2000-01-01",
      status: "ACTIVE",
      plan,
      qr_code: `VRD-${Math.floor(Math.random() * 9000 + 1000)}`,
      consumption_limit: planLimits[plan],
      age_verified: true,
      expires_at: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (memberErr) {
    await admin.auth.admin.deleteUser(userId);
    return { error: memberErr.message };
  }

  await admin.from("profiles").upsert({
    id: userId,
    club_id: clubId,
    name: fullName,
    email,
    role: "MEMBER",
  });

  return { email, password, memberId: member.id };
}
