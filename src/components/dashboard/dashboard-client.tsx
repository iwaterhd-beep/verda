"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Euro,
  ScanLine,
  TrendingUp,
  Download,
  AlertTriangle,
  Clock,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  RevenueAreaChart,
  MembersBarChart,
  PlanDonutChart,
} from "@/components/charts/charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateMemberDialog } from "@/components/members/create-member-dialog";
import { RecentOrdersCard } from "@/components/dashboard/recent-orders-card";
import {
  dashboardGreeting,
  fetchDashboardStats,
} from "@/lib/data/dashboard";
import { avatarUrl, formatCurrency, formatDate, relativeTime } from "@/lib/utils";

export function DashboardClient() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center text-sm text-destructive">
        No se pudo cargar el dashboard. {(error as Error)?.message}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title={dashboardGreeting(stats.userName)}
        description={`Resumen de ${stats.clubName} · ${formatDate(new Date())}`}
      >
        <Button variant="outline" size="sm" disabled>
          <Download className="h-4 w-4" /> Exportar
        </Button>
        <CreateMemberDialog />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Socios activos"
          value={String(stats.activeMembers)}
          delta={stats.activeMembersDelta}
          hint="vs. mes anterior"
          icon={Users}
        />
        <KpiCard
          title="Ingresos del mes"
          value={formatCurrency(stats.monthRevenue)}
          delta={stats.monthRevenueDelta}
          hint="vs. mes anterior"
          icon={Euro}
        />
        <KpiCard
          title="Pedidos hoy"
          value={String(stats.ordersToday)}
          delta={stats.ordersTodayDelta}
          hint="vs. ayer"
          icon={ScanLine}
        />
        <KpiCard
          title="Ticket medio"
          value={formatCurrency(stats.avgTicket)}
          delta={stats.avgTicketDelta}
          hint="últimos 30 días"
          icon={TrendingUp}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Ingresos</CardTitle>
              <CardDescription>Evolución de los últimos 6 meses</CardDescription>
            </div>
            {stats.revenueTrendDelta !== 0 && (
              <Badge variant={stats.revenueTrendDelta >= 0 ? "success" : "destructive"}>
                <TrendingUp className="h-3 w-3" />{" "}
                {stats.revenueTrendDelta >= 0 ? "+" : ""}
                {stats.revenueTrendDelta}%
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {stats.revenueSeries.some((p) => p.value > 0) ? (
              <RevenueAreaChart data={stats.revenueSeries} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Sin ingresos registrados todavía
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de planes</CardTitle>
            <CardDescription>Socios activos por membresía</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.planDistribution.length > 0 ? (
              <>
                <PlanDonutChart data={stats.planDistribution} />
                <div className="mt-2 space-y-2">
                  {stats.planDistribution.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: p.color }}
                        />
                        {p.name}
                      </span>
                      <span className="font-medium">{p.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Aún no hay socios activos
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Nuevos socios</CardTitle>
            <CardDescription>Altas durante esta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <MembersBarChart data={stats.newMembersSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Actividad reciente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentActivity.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin actividad reciente
              </p>
            ) : (
              stats.recentActivity.map((log) => (
                <div key={log.id + log.timestamp} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarUrl(log.memberName)} />
                    <AvatarFallback>
                      {log.memberName.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {log.memberName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.detail}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(log.timestamp)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentOrdersCard />
        {stats.lowStockCount > 0 ? (
          <Card className="border-warning/30 bg-[hsl(var(--warning)/0.06)]">
            <CardContent className="flex items-center gap-4 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">Revisa el inventario</p>
                <p className="text-xs text-muted-foreground">
                  {stats.lowStockCount} producto
                  {stats.lowStockCount !== 1 ? "s" : ""} con stock bajo
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/inventario">Inventario</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <ClipboardList className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">Inventario al día</p>
                <p className="text-xs text-muted-foreground">
                  No hay productos con stock bajo
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/inventario">Ver inventario</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
