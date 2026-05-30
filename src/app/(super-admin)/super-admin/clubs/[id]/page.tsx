"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchClubDetailAction,
  updateClubMetaAction,
  updateClubPlanAction,
} from "@/app/(super-admin)/super-admin/actions";
import { formatCurrency, formatDate } from "@/lib/utils";

const plans = ["FREE", "BASIC", "PRO", "ENTERPRISE"];

export default function SuperAdminClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [plan, setPlan] = React.useState("PRO");
  const [saving, setSaving] = React.useState(false);

  const { data: club, isLoading, error } = useQuery({
    queryKey: ["platform-club", id],
    queryFn: async () => {
      const res = await fetchClubDetailAction(id);
      if ("error" in res) throw new Error(res.error);
      return res;
    },
    enabled: !!id,
  });

  React.useEffect(() => {
    if (club) {
      setName(club.name);
      setCity(club.city ?? "");
      setPlan(club.plan);
    }
  }, [club]);

  async function save() {
    setSaving(true);
    try {
      const [metaRes, planRes] = await Promise.all([
        updateClubMetaAction(id, { name, city: city || null }),
        updateClubPlanAction(id, plan),
      ]);
      if (metaRes.error || planRes.error) {
        toast.error(metaRes.error ?? planRes.error);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["platform-club", id] });
      await queryClient.invalidateQueries({ queryKey: ["platform-clubs"] });
      toast.success("Club actualizado");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-destructive">{(error as Error)?.message ?? "Club no encontrado"}</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/super-admin/clubs")}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px]">
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/super-admin/clubs">
          <ArrowLeft className="h-4 w-4" /> Clubs
        </Link>
      </Button>

      <PageHeader title={club.name} description={`Alta ${formatDate(club.createdAt)}`}>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Socios activos</CardDescription>
            <CardTitle className="text-2xl">{club.activeMemberCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pedidos en preparación</CardDescription>
            <CardTitle className="text-2xl">{club.preparingOrders}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ingresos totales</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(club.revenueTotal)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del club</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Ciudad</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Plan</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl bg-secondary/40 p-3 text-sm">
              <p className="text-muted-foreground">Administrador</p>
              <p className="font-medium">{club.adminName ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{club.adminEmail ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos recientes</CardTitle>
            <CardDescription>
              {club.pendingApplications} solicitudes pendientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {club.recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sin pedidos todavía
              </p>
            ) : (
              club.recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                >
                  <div>
                    <p className="font-mono text-sm">{o.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.memberName} · {formatDate(o.createdAt, true)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(o.total)}</p>
                    <Badge variant="secondary" className="text-[0.65rem]">
                      {o.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
