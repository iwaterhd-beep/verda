"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Users,
  ClipboardList,
  Euro,
  UserPlus,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchPlatformClubsAction,
  fetchPlatformStatsAction,
} from "@/app/(super-admin)/super-admin/actions";
import { formatCurrency, formatDate } from "@/lib/utils";

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
}

export default function SuperAdminDashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const res = await fetchPlatformStatsAction();
      if ("error" in res) throw new Error(res.error);
      return res;
    },
  });

  const clubsQuery = useQuery({
    queryKey: ["platform-clubs"],
    queryFn: async () => {
      const res = await fetchPlatformClubsAction();
      if ("error" in res) throw new Error(res.error);
      return res;
    },
  });

  const stats = statsQuery.data;
  const recentClubs = (clubsQuery.data ?? []).slice(0, 5);

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Plataforma Verda"
        description={`Vista global · ${formatDate(new Date())}`}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/super-admin/clubs">Ver clubs</Link>
        </Button>
      </PageHeader>

      {statsQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : statsQuery.error ? (
        <p className="text-sm text-destructive">
          {(statsQuery.error as Error).message}
        </p>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Clubs" value={String(stats.clubs)} icon={Building2} />
          <StatCard
            title="Socios activos"
            value={String(stats.activeMembers)}
            icon={Users}
          />
          <StatCard
            title="Pedidos este mes"
            value={String(stats.ordersThisMonth)}
            icon={ClipboardList}
          />
          <StatCard
            title="Ingresos del mes"
            value={formatCurrency(stats.revenueThisMonth)}
            icon={Euro}
          />
          <StatCard
            title="Solicitudes pendientes"
            value={String(stats.pendingApplications)}
            icon={UserPlus}
          />
          <StatCard
            title="Usuarios staff"
            value={String(stats.staffUsers)}
            icon={Users}
          />
        </div>
      ) : null}

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Clubs recientes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/super-admin/clubs">
              Todos <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {clubsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : recentClubs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay clubs registrados.
            </p>
          ) : (
            recentClubs.map((club) => (
              <Link
                key={club.id}
                href={`/super-admin/clubs/${club.id}`}
                className="flex items-center justify-between rounded-xl border border-border/60 p-3 transition-colors hover:bg-secondary/40"
              >
                <div className="min-w-0">
                  <p className="font-medium">{club.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {club.city ?? "Sin ciudad"} · {club.adminEmail ?? "Sin admin"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">{club.plan}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {club.activeMemberCount} socios
                  </span>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
