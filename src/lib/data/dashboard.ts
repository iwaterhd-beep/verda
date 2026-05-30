"use client";

import { createClient } from "@/lib/supabase/client";
import type { KpiPoint } from "@/types";

export interface PlanSlice {
  name: string;
  value: number;
  color: string;
}

export interface RecentActivity {
  id: string;
  memberName: string;
  label: string;
  detail: string;
  timestamp: string;
}

export interface DashboardStats {
  clubName: string;
  userName: string;
  activeMembers: number;
  activeMembersDelta: number;
  monthRevenue: number;
  monthRevenueDelta: number;
  ordersToday: number;
  ordersTodayDelta: number;
  avgTicket: number;
  avgTicketDelta: number;
  revenueSeries: KpiPoint[];
  revenueTrendDelta: number;
  planDistribution: PlanSlice[];
  newMembersSeries: KpiPoint[];
  recentActivity: RecentActivity[];
  lowStockCount: number;
}

const planMeta: Record<string, { label: string; color: string }> = {
  BASIC: { label: "Básico", color: "#94a3b8" },
  PREMIUM: { label: "Premium", color: "#22c55e" },
  VIP: { label: "VIP", color: "#8b5cf6" },
};

function pctDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function isValidOrder(status: string) {
  return status !== "CANCELLED";
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let clubName = "Tu club";
  let userName = "Admin";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, club_id")
      .eq("id", user.id)
      .single();
    userName = profile?.name ?? user.email?.split("@")[0] ?? "Admin";
    if (profile?.club_id) {
      const { data: club } = await supabase
        .from("clubs")
        .select("name")
        .eq("id", profile.club_id)
        .single();
      clubName = club?.name ?? clubName;
    }
  }

  const [membersRes, ordersRes, productsRes] = await Promise.all([
    supabase.from("members").select("status, plan, joined_at, created_at"),
    supabase.from("orders").select("total, status, created_at, code, payment_method, members(full_name)"),
    supabase.from("products").select("stock, low_stock_threshold"),
  ]);

  if (membersRes.error) throw membersRes.error;
  if (ordersRes.error) throw ordersRes.error;
  if (productsRes.error) throw productsRes.error;

  const members = membersRes.data ?? [];
  const orders = ordersRes.data ?? [];
  const products = productsRes.data ?? [];

  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const activeMembers = members.filter((m) => m.status === "ACTIVE").length;
  const activeLastMonth = members.filter((m) => {
    if (m.status !== "ACTIVE") return false;
    const joined = new Date(m.joined_at ?? m.created_at ?? 0);
    return joined < thisMonthStart;
  }).length;

  const validOrders = orders.filter((o) => isValidOrder(o.status));

  const monthRevenue = validOrders
    .filter((o) => new Date(o.created_at) >= thisMonthStart)
    .reduce((sum, o) => sum + Number(o.total), 0);

  const lastMonthRevenue = validOrders
    .filter((o) => {
      const d = new Date(o.created_at);
      return d >= lastMonthStart && d < thisMonthStart;
    })
    .reduce((sum, o) => sum + Number(o.total), 0);

  const ordersToday = orders.filter(
    (o) => isValidOrder(o.status) && new Date(o.created_at) >= todayStart,
  ).length;

  const ordersYesterday = orders.filter((o) => {
    const d = new Date(o.created_at);
    return isValidOrder(o.status) && d >= yesterdayStart && d < todayStart;
  }).length;

  const last30 = validOrders.filter((o) => new Date(o.created_at) >= thirtyDaysAgo);
  const prev30 = validOrders.filter((o) => {
    const d = new Date(o.created_at);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  });

  const avgTicket =
    last30.length > 0
      ? last30.reduce((s, o) => s + Number(o.total), 0) / last30.length
      : 0;
  const avgTicketPrev =
    prev30.length > 0
      ? prev30.reduce((s, o) => s + Number(o.total), 0) / prev30.length
      : 0;

  const revenueByMonth = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    revenueByMonth.set(monthKey(d), 0);
  }
  for (const o of validOrders) {
    const d = new Date(o.created_at);
    const key = monthKey(d);
    if (revenueByMonth.has(key)) {
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(o.total));
    }
  }
  const revenueSeries: KpiPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    revenueSeries.push({
      label: d.toLocaleDateString("es-ES", { month: "short" }),
      value: Math.round((revenueByMonth.get(monthKey(d)) ?? 0) * 100) / 100,
    });
  }

  const revenueTrendDelta = pctDelta(monthRevenue, lastMonthRevenue);

  const planCounts = new Map<string, number>();
  for (const m of members.filter((x) => x.status === "ACTIVE")) {
    const plan = (m.plan ?? "BASIC").toUpperCase();
    planCounts.set(plan, (planCounts.get(plan) ?? 0) + 1);
  }
  const planTotal = [...planCounts.values()].reduce((a, b) => a + b, 0) || 1;
  const planDistribution: PlanSlice[] = ["BASIC", "PREMIUM", "VIP"]
    .filter((p) => (planCounts.get(p) ?? 0) > 0)
    .map((p) => ({
      name: planMeta[p]?.label ?? p,
      value: Math.round(((planCounts.get(p) ?? 0) / planTotal) * 100),
      color: planMeta[p]?.color ?? "#64748b",
    }));

  const newMembersSeries: KpiPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const count = members.filter((m) => {
      const joined = new Date(m.joined_at ?? m.created_at ?? 0);
      return joined >= dayStart && joined < dayEnd;
    }).length;
    newMembersSeries.push({
      label: day.toLocaleDateString("es-ES", { weekday: "short" }),
      value: count,
    });
  }

  type OrderActivityRow = {
    code: string;
    payment_method: string;
    created_at: string;
    members: { full_name: string } | { full_name: string }[] | null;
  };

  const paymentLabels: Record<string, string> = {
    WALLET: "Monedero",
    CASH: "Efectivo",
    CRYPTO: "Cripto",
  };

  const recentActivity: RecentActivity[] = (orders as OrderActivityRow[])
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5)
    .map((row) => {
      const members = row.members;
      const memberName = Array.isArray(members)
        ? members[0]?.full_name
        : members?.full_name;
      return {
        id: row.code,
        memberName: memberName ?? "Socio",
        label: row.code,
        detail: `Pedido · ${paymentLabels[row.payment_method] ?? row.payment_method}`,
        timestamp: row.created_at,
      };
    });

  const lowStockCount = products.filter(
    (p) => Number(p.stock) < Number(p.low_stock_threshold),
  ).length;

  return {
    clubName,
    userName,
    activeMembers,
    activeMembersDelta: pctDelta(activeMembers, activeLastMonth),
    monthRevenue: Math.round(monthRevenue * 100) / 100,
    monthRevenueDelta: pctDelta(monthRevenue, lastMonthRevenue),
    ordersToday,
    ordersTodayDelta: pctDelta(ordersToday, ordersYesterday),
    avgTicket: Math.round(avgTicket * 100) / 100,
    avgTicketDelta: pctDelta(avgTicket, avgTicketPrev),
    revenueSeries,
    revenueTrendDelta,
    planDistribution,
    newMembersSeries,
    recentActivity,
    lowStockCount,
  };
}

function greetingForHour(hour: number) {
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function dashboardGreeting(name: string) {
  return `${greetingForHour(new Date().getHours())}, ${name.split(" ")[0]} 👋`;
}
