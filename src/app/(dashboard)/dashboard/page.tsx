import {
  Users,
  Euro,
  ScanLine,
  TrendingUp,
  Download,
  AlertTriangle,
  Clock,
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
import {
  accessLogs,
  newMembersSeries,
  planDistribution,
  revenueSeries,
} from "@/lib/mock-data";
import { RecentOrdersCard } from "@/components/dashboard/recent-orders-card";
import { avatarUrl, formatDate, relativeTime } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Buenas tardes, Álex 👋"
        description={`Resumen de Club Verde · ${formatDate(new Date())}`}
      >
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" /> Exportar
        </Button>
        <CreateMemberDialog />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Socios activos"
          value="128"
          delta={12.4}
          hint="vs. mes anterior"
          icon={Users}
        />
        <KpiCard
          title="Ingresos del mes"
          value="31.200 €"
          delta={8.1}
          hint="vs. mes anterior"
          icon={Euro}
        />
        <KpiCard
          title="Visitas hoy"
          value="47"
          delta={-3.2}
          hint="aforo 58%"
          icon={ScanLine}
        />
        <KpiCard
          title="Ticket medio"
          value="27,40 €"
          delta={5.6}
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
            <Badge variant="success">
              <TrendingUp className="h-3 w-3" /> +18%
            </Badge>
          </CardHeader>
          <CardContent>
            <RevenueAreaChart data={revenueSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de planes</CardTitle>
            <CardDescription>Socios por tipo de membresía</CardDescription>
          </CardHeader>
          <CardContent>
            <PlanDonutChart data={planDistribution} />
            <div className="mt-2 space-y-2">
              {planDistribution.map((p) => (
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
            <MembersBarChart data={newMembersSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Actividad reciente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {accessLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center gap-3">
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
                    {log.type === "CHECK_IN" ? "Entrada" : "Salida"} ·{" "}
                    {log.method}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {relativeTime(log.timestamp)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentOrdersCard />
        <Card className="border-warning/30 bg-[hsl(var(--warning)/0.06)]">
          <CardContent className="flex items-center gap-4 py-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">Revisa el inventario</p>
              <p className="text-xs text-muted-foreground">
                El stock se actualiza al marcar pedidos como listos.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/inventario">Inventario</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
