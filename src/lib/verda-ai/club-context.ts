import { createClient } from "@/lib/supabase/server";

export interface VerdaAiClubContext {
  clubName: string;
  userName: string;
  activeMembers: number;
  pendingApplications: number;
  monthRevenue: number;
  monthRevenueDelta: number;
  ordersToday: number;
  preparingOrders: number;
  readyOrders: number;
  lowStockProducts: { name: string; stock: number; threshold: number }[];
  productCount: number;
  hiddenProductCount: number;
  recentOrderCodes: string[];
}

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

export async function fetchVerdaAiClubContext(): Promise<
  VerdaAiClubContext | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, club_id")
    .eq("id", user.id)
    .single();

  if (!profile?.club_id || profile.role === "MEMBER") {
    return { error: "Sin permisos." };
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("name")
    .eq("id", profile.club_id)
    .single();

  const clubId = profile.club_id;
  const now = new Date();
  const todayStart = startOfDay(now);
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  );

  const [membersRes, appsRes, ordersRes, productsInitial] = await Promise.all([
    supabase
      .from("members")
      .select("status")
      .eq("club_id", clubId),
    supabase
      .from("member_applications")
      .select("status")
      .eq("club_id", clubId),
    supabase
      .from("orders")
      .select("code, total, status, created_at")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("products")
      .select("name, stock, low_stock_threshold, hidden_from_members")
      .eq("club_id", clubId),
  ]);

  let productsRes = productsInitial;
  if (productsRes.error && /hidden_from_members/i.test(productsRes.error.message)) {
    productsRes = await supabase
      .from("products")
      .select("name, stock, low_stock_threshold")
      .eq("club_id", clubId);
  }

  let hiddenProductCount = 0;

  if (membersRes.error) return { error: membersRes.error.message };
  if (appsRes.error) return { error: appsRes.error.message };
  if (ordersRes.error) return { error: ordersRes.error.message };
  if (productsRes.error) return { error: productsRes.error.message };

  const members = membersRes.data ?? [];
  const applications = appsRes.data ?? [];
  const orders = ordersRes.data ?? [];
  const products = productsRes.data ?? [];

  hiddenProductCount = products.filter(
    (p) => "hidden_from_members" in p && p.hidden_from_members,
  ).length;

  const validOrders = orders.filter((o) => o.status !== "CANCELLED");

  const monthRevenue = validOrders
    .filter((o) => new Date(o.created_at) >= thisMonthStart)
    .reduce((sum, o) => sum + Number(o.total), 0);

  const lastMonthRevenue = validOrders
    .filter((o) => {
      const d = new Date(o.created_at);
      return d >= lastMonthStart && d < thisMonthStart;
    })
    .reduce((sum, o) => sum + Number(o.total), 0);

  const ordersToday = validOrders.filter(
    (o) => new Date(o.created_at) >= todayStart,
  ).length;

  const preparingOrders = orders.filter((o) => o.status === "PREPARING").length;
  const readyOrders = orders.filter((o) => o.status === "READY").length;

  const lowStockProducts = products
    .filter((p) => Number(p.stock) < Number(p.low_stock_threshold))
    .slice(0, 8)
    .map((p) => ({
      name: p.name,
      stock: Number(p.stock),
      threshold: Number(p.low_stock_threshold),
    }));

  return {
    clubName: club?.name ?? "Tu club",
    userName: profile.name ?? user.email?.split("@")[0] ?? "Admin",
    activeMembers: members.filter((m) => m.status === "ACTIVE").length,
    pendingApplications: applications.filter((a) => a.status === "PENDING")
      .length,
    monthRevenue: Math.round(monthRevenue * 100) / 100,
    monthRevenueDelta: pctDelta(monthRevenue, lastMonthRevenue),
    ordersToday,
    preparingOrders,
    readyOrders,
    lowStockProducts,
    productCount: products.length,
    hiddenProductCount,
    recentOrderCodes: validOrders.slice(0, 5).map((o) => o.code),
  };
}

export function formatClubContextForPrompt(ctx: VerdaAiClubContext): string {
  const lowStock =
    ctx.lowStockProducts.length > 0
      ? ctx.lowStockProducts
          .map((p) => `${p.name} (${p.stock} / umbral ${p.threshold})`)
          .join(", ")
      : "ninguno";

  return [
    `Club: ${ctx.clubName}`,
    `Usuario staff: ${ctx.userName}`,
    `Socios activos: ${ctx.activeMembers}`,
    `Solicitudes pendientes: ${ctx.pendingApplications}`,
    `Ingresos del mes: ${ctx.monthRevenue} Crd (${ctx.monthRevenueDelta >= 0 ? "+" : ""}${ctx.monthRevenueDelta}% vs mes anterior)`,
    `Pedidos hoy: ${ctx.ordersToday}`,
    `Pedidos en preparación: ${ctx.preparingOrders}`,
    `Pedidos listos para recoger: ${ctx.readyOrders}`,
    `Productos en catálogo: ${ctx.productCount} (${ctx.hiddenProductCount} ocultos al portal)`,
    `Stock bajo: ${lowStock}`,
    ctx.recentOrderCodes.length
      ? `Últimos pedidos: ${ctx.recentOrderCodes.join(", ")}`
      : "Sin pedidos recientes",
  ].join("\n");
}
