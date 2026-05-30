import type { Metadata } from "next";
import {
  ShieldCheck,
  FileDown,
  History,
  Lock,
  FileSignature,
  Database,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Legal y RGPD" };

const auditLog = [
  { id: 1, actor: "Álex Ríos", action: "Exportó datos de socio (RGPD)", at: "2026-05-29T16:20:00", level: "info" },
  { id: 2, actor: "Sistema", action: "Bloqueo automático: membresía caducada", at: "2026-05-29T08:00:00", level: "warn" },
  { id: 3, actor: "María López", action: "Modificó permisos de empleado", at: "2026-05-28T14:11:00", level: "info" },
  { id: 4, actor: "Álex Ríos", action: "Eliminó socio (derecho al olvido)", at: "2026-05-27T10:05:00", level: "danger" },
];

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Legal y cumplimiento"
        description="RGPD, consentimientos, registros de auditoría y exportación de datos."
      >
        <Button variant="outline" size="sm">
          <FileDown className="h-4 w-4" /> Exportar registro
        </Button>
      </PageHeader>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ComplianceStat
          icon={FileSignature}
          label="Consentimientos firmados"
          value="96%"
          detail="123 de 128 socios"
        />
        <ComplianceStat
          icon={ShieldCheck}
          label="Verificación de edad"
          value="100%"
          detail="Todos los socios activos"
        />
        <ComplianceStat
          icon={Lock}
          label="Datos cifrados"
          value="AES-256"
          detail="En reposo y en tránsito"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Registro de auditoría</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead className="text-right pr-6">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="pl-6 font-medium">{l.actor}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 text-sm">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            l.level === "danger"
                              ? "bg-destructive"
                              : l.level === "warn"
                                ? "bg-[hsl(var(--warning))]"
                                : "bg-primary"
                          }`}
                        />
                        {l.action}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right text-sm text-muted-foreground">
                      {formatDate(l.at, true)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Derechos RGPD</CardTitle>
            <CardDescription>Gestión de datos personales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { icon: Database, label: "Exportar datos de un socio" },
              { icon: FileSignature, label: "Reenviar consentimiento" },
              { icon: Lock, label: "Anonimizar / derecho al olvido" },
            ].map((a) => (
              <Button
                key={a.label}
                variant="outline"
                className="w-full justify-start"
              >
                <a.icon className="h-4 w-4" /> {a.label}
              </Button>
            ))}
            <div className="mt-3 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
              Verda cumple con el RGPD y la LOPDGDD. Todos los accesos quedan
              registrados de forma inmutable.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ComplianceStat({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xl font-semibold leading-none">{value}</p>
          <p className="mt-1 text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
