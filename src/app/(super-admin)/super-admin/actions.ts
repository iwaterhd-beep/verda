"use server";

import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { createAdminClient } from "@/lib/supabase/server";
import type { Role } from "@/types";

export interface PlatformStats {
  clubs: number;
  members: number;
  activeMembers: number;
  staffUsers: number;
  ordersThisMonth: number;
  pendingApplications: number;
  revenueThisMonth: number;
}

export interface PlatformClub {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  plan: string;
  brandColor: string;
  createdAt: string;
  memberCount: number;
  activeMemberCount: number;
  adminName: string | null;
  adminEmail: string | null;
  orderCount: number;
  revenueTotal: number;
}

export interface PlatformUser {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  clubId: string | null;
  clubName: string | null;
  createdAt: string;
}

export interface ClubDetail extends PlatformClub {
  pendingApplications: number;
  preparingOrders: number;
  recentOrders: {
    id: string;
    code: string;
    total: number;
    status: string;
    createdAt: string;
    memberName: string;
  }[];
}

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

function monthStartIso() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function checkSuperAdminExistsAction(): Promise<boolean> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "SUPER_ADMIN");
  return (count ?? 0) > 0;
}

export async function bootstrapSuperAdminAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const secret = String(formData.get("secret") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim() || "Super Admin";

  const expected = process.env.SUPER_ADMIN_BOOTSTRAP_SECRET;
  if (!expected) {
    return {
      error:
        "Falta SUPER_ADMIN_BOOTSTRAP_SECRET en .env.local. Añádela y reinicia el servidor.",
    };
  }
  if (secret !== expected) return { error: "Clave de bootstrap incorrecta." };
  if (!email) return { error: "Indica un email." };
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "SUPER_ADMIN");
  if ((count ?? 0) > 0) {
    return { error: "Ya existe un super admin. Usa login normal." };
  }

  let userId: string | undefined;

  const { data: listed } = await admin.auth.admin.listUsers();
  const existing = listed.users.find(
    (u) => u.email?.toLowerCase() === email,
  );

  if (existing) {
    userId = existing.id;
    if (password) {
      await admin.auth.admin.updateUserById(userId, { password });
    }
  } else {
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: "SUPER_ADMIN" },
      });
    if (createErr || !created.user) {
      return { error: createErr?.message ?? "No se pudo crear el usuario." };
    }
    userId = created.user.id;
  }

  const { error: profileErr } = await admin.from("profiles").upsert(
    {
      id: userId,
      club_id: null,
      name,
      email,
      role: "SUPER_ADMIN",
    },
    { onConflict: "id" },
  );
  if (profileErr) return { error: profileErr.message };

  redirect("/login?redirect=/super-admin");
}

export async function fetchPlatformStatsAction(): Promise<
  PlatformStats | { error: string }
> {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { error: auth.error };
  const { admin } = auth.ctx;

  const monthStart = monthStartIso();

  const [
    clubsRes,
    membersRes,
    activeRes,
    staffRes,
    ordersRes,
    appsRes,
    revenueRes,
  ] = await Promise.all([
    admin.from("clubs").select("id", { count: "exact", head: true }),
    admin.from("members").select("id", { count: "exact", head: true }),
    admin
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE"),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .neq("role", "MEMBER"),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart)
      .neq("status", "CANCELLED"),
    admin
      .from("member_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING"),
    admin
      .from("orders")
      .select("total")
      .gte("created_at", monthStart)
      .neq("status", "CANCELLED"),
  ]);

  const revenueThisMonth = (revenueRes.data ?? []).reduce(
    (sum, row) => sum + Number(row.total),
    0,
  );

  return {
    clubs: clubsRes.count ?? 0,
    members: membersRes.count ?? 0,
    activeMembers: activeRes.count ?? 0,
    staffUsers: staffRes.count ?? 0,
    ordersThisMonth: ordersRes.count ?? 0,
    pendingApplications: appsRes.count ?? 0,
    revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
  };
}

export async function fetchPlatformClubsAction(): Promise<
  PlatformClub[] | { error: string }
> {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { error: auth.error };
  const { admin } = auth.ctx;

  const { data: clubs, error } = await admin
    .from("clubs")
    .select("id, name, slug, city, plan, brand_color, created_at")
    .order("created_at", { ascending: false });
  if (error) return { error: error.message };

  const { data: members } = await admin
    .from("members")
    .select("id, club_id, status");
  const { data: profiles } = await admin
    .from("profiles")
    .select("club_id, name, email, role")
    .eq("role", "CLUB_ADMIN");
  const { data: orders } = await admin
    .from("orders")
    .select("club_id, total, status");

  return (clubs ?? []).map((club) => {
    const clubMembers = (members ?? []).filter((m) => m.club_id === club.id);
    const adminProfile = (profiles ?? []).find((p) => p.club_id === club.id);
    const clubOrders = (orders ?? []).filter(
      (o) => o.club_id === club.id && o.status !== "CANCELLED",
    );
    const revenueTotal = clubOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0,
    );

    return {
      id: club.id,
      name: club.name,
      slug: club.slug,
      city: club.city,
      plan: club.plan ?? "PRO",
      brandColor: club.brand_color ?? "#22c55e",
      createdAt: club.created_at,
      memberCount: clubMembers.length,
      activeMemberCount: clubMembers.filter((m) => m.status === "ACTIVE")
        .length,
      adminName: adminProfile?.name ?? null,
      adminEmail: adminProfile?.email ?? null,
      orderCount: clubOrders.length,
      revenueTotal: Math.round(revenueTotal * 100) / 100,
    };
  });
}

export async function fetchClubDetailAction(
  clubId: string,
): Promise<ClubDetail | { error: string }> {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { error: auth.error };
  const { admin } = auth.ctx;

  const clubs = await fetchPlatformClubsAction();
  if ("error" in clubs) return { error: clubs.error };
  const club = clubs.find((c) => c.id === clubId);
  if (!club) return { error: "Club no encontrado." };

  const [{ count: pendingApps }, { count: preparing }, { data: recent }] =
    await Promise.all([
      admin
        .from("member_applications")
        .select("id", { count: "exact", head: true })
        .eq("club_id", clubId)
        .eq("status", "PENDING"),
      admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("club_id", clubId)
        .eq("status", "PREPARING"),
      admin
        .from("orders")
        .select("id, code, total, status, created_at, member_id")
        .eq("club_id", clubId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const memberIds = [...new Set((recent ?? []).map((o) => o.member_id))];
  const { data: memberRows } = memberIds.length
    ? await admin.from("members").select("id, full_name").in("id", memberIds)
    : { data: [] as { id: string; full_name: string }[] };
  const memberNames = new Map(
    (memberRows ?? []).map((m) => [m.id, m.full_name]),
  );

  return {
    ...club,
    pendingApplications: pendingApps ?? 0,
    preparingOrders: preparing ?? 0,
    recentOrders: (recent ?? []).map((o) => ({
      id: o.id,
      code: o.code,
      total: Number(o.total),
      status: o.status,
      createdAt: o.created_at,
      memberName: memberNames.get(o.member_id) ?? "Socio",
    })),
  };
}

export async function fetchPlatformUsersAction(): Promise<
  PlatformUser[] | { error: string }
> {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { error: auth.error };
  const { admin } = auth.ctx;

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, name, email, role, club_id, created_at")
    .order("created_at", { ascending: false });
  if (error) return { error: error.message };

  const clubIds = [
    ...new Set((profiles ?? []).map((p) => p.club_id).filter(Boolean)),
  ] as string[];
  const { data: clubs } = clubIds.length
    ? await admin.from("clubs").select("id, name").in("id", clubIds)
    : { data: [] as { id: string; name: string }[] };
  const clubNames = new Map((clubs ?? []).map((c) => [c.id, c.name]));

  return (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role as Role,
    clubId: p.club_id,
    clubName: p.club_id ? (clubNames.get(p.club_id) ?? null) : null,
    createdAt: p.created_at,
  }));
}

export async function updateClubPlanAction(
  clubId: string,
  plan: string,
): Promise<ActionResult> {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { error: auth.error };

  const allowed = ["FREE", "BASIC", "PRO", "ENTERPRISE"];
  if (!allowed.includes(plan)) return { error: "Plan no válido." };

  const { error } = await auth.ctx.admin
    .from("clubs")
    .update({ plan })
    .eq("id", clubId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function updateClubMetaAction(
  clubId: string,
  data: { name?: string; city?: string | null },
): Promise<ActionResult> {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { error: auth.error };

  const patch: Record<string, string | null> = {};
  if (data.name?.trim()) patch.name = data.name.trim();
  if (data.city !== undefined) patch.city = data.city?.trim() || null;

  if (!Object.keys(patch).length) return { error: "Nada que actualizar." };

  const { error } = await auth.ctx.admin
    .from("clubs")
    .update(patch)
    .eq("id", clubId);
  if (error) return { error: error.message };
  return { ok: true };
}
