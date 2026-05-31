"use client";

import { createClient } from "@/lib/supabase/client";
import type { Member, WalletMovement, WalletMovementType } from "@/types";

type MemberRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  document_id: string | null;
  birth_date: string | null;
  locality: string | null;
  address: string | null;
  status: Member["status"];
  plan: string | null;
  qr_code: string | null;
  wallet_balance: number | null;
  consumption_limit: number | null;
  consumed_this_month: number | null;
  age_verified: boolean | null;
  joined_at: string | null;
  expires_at: string | null;
  avatar_url: string | null;
};

function toMember(r: MemberRow): Member {
  return {
    id: r.id,
    fullName: r.full_name,
    email: r.email ?? "",
    phone: r.phone ?? "",
    documentType: "DNI",
    documentId: r.document_id ?? "",
    birthDate: r.birth_date ?? "2000-01-01",
    status: r.status,
    membershipPlan: (r.plan as Member["membershipPlan"]) ?? "BASIC",
    joinedAt: r.joined_at ?? new Date().toISOString().slice(0, 10),
    expiresAt: r.expires_at ?? new Date().toISOString().slice(0, 10),
    qrCode: r.qr_code ?? "",
    consumptionLimit: r.consumption_limit ?? 40,
    consumedThisMonth: Number(r.consumed_this_month ?? 0),
    signatureSigned: true,
    ageVerified: !!r.age_verified,
    avatarSeed: r.full_name,
    avatarUrl: r.avatar_url,
    walletBalance: Number(r.wallet_balance ?? 0),
  };
}

async function myClubId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("club_id")
    .eq("id", user.id)
    .single();
  return (data?.club_id as string | null) ?? null;
}

export async function fetchMembers(): Promise<Member[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as MemberRow[]).map(toMember);
}

export async function fetchMyMember(): Promise<Member | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? toMember(data as MemberRow) : null;
}

export async function fetchMember(id: string): Promise<Member | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toMember(data as MemberRow) : null;
}

const planLimits: Record<string, number> = { BASIC: 40, PREMIUM: 60, VIP: 100 };

export interface NewMemberInput {
  fullName: string;
  email?: string;
  phone?: string;
  documentId?: string;
  birthDate?: string;
  plan?: Member["membershipPlan"];
}

export async function createMember(input: NewMemberInput): Promise<Member> {
  const supabase = createClient();
  const clubId = await myClubId();
  const plan = input.plan ?? "BASIC";
  const { data, error } = await supabase
    .from("members")
    .insert({
      club_id: clubId,
      full_name: input.fullName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      document_id: input.documentId ?? null,
      birth_date: input.birthDate || "2000-01-01",
      status: "PENDING",
      plan,
      qr_code: `VRD-${Math.floor(Math.random() * 9000 + 1000)}`,
      consumption_limit: planLimits[plan],
      expires_at: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10),
    })
    .select("*")
    .single();
  if (error) throw error;
  return toMember(data as MemberRow);
}

export async function updateMemberStatus(id: string, status: Member["status"]) {
  const supabase = createClient();
  const { error } = await supabase
    .from("members")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMember(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw error;
}

// ─── Cartera ──────────────────────────────────────────────────

type MovementRow = {
  id: string;
  amount: number;
  type: WalletMovementType;
  reason: string | null;
  balance_after: number | null;
  created_at: string;
};

export async function fetchWalletMovements(
  memberId: string,
): Promise<WalletMovement[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("wallet_movements")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as MovementRow[]).map((m) => ({
    id: m.id,
    amount: Number(m.amount),
    type: m.type,
    reason: m.reason ?? undefined,
    balanceAfter: Number(m.balance_after ?? 0),
    createdAt: m.created_at,
  }));
}

export async function adjustWallet(
  memberId: string,
  amount: number,
  type: WalletMovementType,
  reason?: string,
) {
  const supabase = createClient();
  const { data: member, error: fetchErr } = await supabase
    .from("members")
    .select("wallet_balance")
    .eq("id", memberId)
    .single();
  if (fetchErr) throw fetchErr;

  const current = Number(member.wallet_balance ?? 0);
  const balanceAfter = Math.round((current + amount) * 100) / 100;

  const { error: updErr } = await supabase
    .from("members")
    .update({ wallet_balance: balanceAfter })
    .eq("id", memberId);
  if (updErr) throw updErr;

  const { error: movErr } = await supabase.from("wallet_movements").insert({
    member_id: memberId,
    amount,
    type,
    reason: reason ?? null,
    balance_after: balanceAfter,
  });
  if (movErr) throw movErr;

  return balanceAfter;
}
