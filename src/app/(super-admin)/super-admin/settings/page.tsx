import Link from "next/link";
import { Shield, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { checkSuperAdminExistsAction } from "@/app/(super-admin)/super-admin/actions";

export default async function SuperAdminSettingsPage() {
  const hasSuperAdmin = await checkSuperAdminExistsAction();

  return (
    <div className="mx-auto max-w-[700px]">
      <PageHeader
        title="Configuración"
        description="Ajustes de la plataforma Verda"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> Super admin
          </CardTitle>
          <CardDescription>
            Acceso global a todos los clubs. Solo debe existir un número limitado
            de cuentas con este rol.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
            <div>
              <p className="text-sm font-medium">Estado</p>
              <p className="text-xs text-muted-foreground">
                {hasSuperAdmin
                  ? "Super admin configurado"
                  : "Pendiente de bootstrap inicial"}
              </p>
            </div>
            <Badge variant={hasSuperAdmin ? "success" : "warning"}>
              {hasSuperAdmin ? "Activo" : "Setup"}
            </Badge>
          </div>

          {!hasSuperAdmin && (
            <Button asChild>
              <Link href="/super-admin/setup">
                <KeyRound className="h-4 w-4" /> Configurar super admin
              </Link>
            </Button>
          )}

          <div className="rounded-xl bg-secondary/40 p-4 text-xs text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Promover cuenta existente (SQL)</p>
            <pre className="overflow-x-auto rounded-lg bg-background p-3 font-mono text-[0.7rem]">
{`update public.profiles
set role = 'SUPER_ADMIN', club_id = null
where email = 'tu@email.com';`}
            </pre>
            <p>
              Ejecuta también{" "}
              <code className="rounded bg-background px-1">supabase/super-admin.sql</code>{" "}
              si tu base de datos ya existía antes de esta actualización.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
