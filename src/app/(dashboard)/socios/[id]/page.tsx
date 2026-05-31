"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  CalendarDays,
  FileText,
  ShieldCheck,
  PenLine,
  QrCode,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { StatusBadge, PlanBadge } from "@/components/members/status-badge";
import { WalletPanel } from "@/components/members/wallet-panel";
import { fetchMember } from "@/lib/data/members";
import { accessLogs } from "@/lib/mock-data";
import { memberAvatarUrl, formatDate, relativeTime } from "@/lib/utils";

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: member, isLoading } = useQuery({
    queryKey: ["member", id],
    queryFn: () => fetchMember(id),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <p className="text-muted-foreground">Socio no encontrado.</p>
        <Button className="mt-4" onClick={() => router.push("/socios")}>
          Volver a socios
        </Button>
      </div>
    );
  }

  const consumePct = Math.round(
    (member.consumedThisMonth / member.consumptionLimit) * 100,
  );

  return (
    <div className="mx-auto max-w-[1100px]">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Volver
      </Button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <Avatar className="h-20 w-20 rounded-2xl">
              <AvatarImage src={memberAvatarUrl(member)} />
              <AvatarFallback className="text-lg">
                {member.fullName.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-3 text-lg font-semibold">{member.fullName}</h2>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={member.status} />
              <PlanBadge plan={member.membershipPlan} />
            </div>

            <div className="mt-5 w-full space-y-2.5 text-left text-sm">
              <InfoRow icon={Mail} label={member.email} />
              <InfoRow icon={Phone} label={member.phone} />
              <InfoRow
                icon={FileText}
                label={`${member.documentType} · ${member.documentId}`}
              />
              <InfoRow
                icon={CalendarDays}
                label={`Nac. ${formatDate(member.birthDate)}`}
              />
            </div>

            <Separator className="my-5" />

            <div className="grid w-full place-items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/30 py-5">
              <QrCode className="h-16 w-16 text-foreground/80" />
              <p className="font-mono text-xs text-muted-foreground">
                {member.qrCode}
              </p>
            </div>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              <QrCode className="h-4 w-4" /> Descargar carnet
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Tabs defaultValue="resumen">
            <TabsList>
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="cartera">Cartera</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Membresía</CardTitle>
                  <CardDescription>
                    Alta {formatDate(member.joinedAt)} · Vence{" "}
                    {formatDate(member.expiresAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Consumo mensual
                      </span>
                      <span className="font-medium">
                        {member.consumedThisMonth}g / {member.consumptionLimit}g
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${consumePct}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <ComplianceCard
                      ok={member.ageVerified}
                      icon={ShieldCheck}
                      label="Verificación de edad"
                    />
                    <ComplianceCard
                      ok={member.signatureSigned}
                      icon={PenLine}
                      label="Firma del consentimiento"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cartera">
              <WalletPanel memberId={member.id} />
            </TabsContent>

            <TabsContent value="documentos">
              <Card>
                <CardHeader>
                  <CardTitle>Documentos</CardTitle>
                  <CardDescription>
                    Consentimientos, contratos y archivos del socio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    "Consentimiento RGPD.pdf",
                    "Contrato de socio.pdf",
                    "Documento de identidad.jpg",
                  ].map((doc) => (
                    <div
                      key={doc}
                      className="flex items-center gap-3 rounded-xl border border-border/60 p-3"
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="flex-1 text-sm">{doc}</span>
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historial">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de accesos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {accessLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 text-sm">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span className="flex-1">
                        {log.type === "CHECK_IN" ? "Entrada" : "Salida"} ·{" "}
                        {log.location}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {relativeTime(log.timestamp)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate text-foreground/90">{label}</span>
    </div>
  );
}

function ComplianceCard({
  ok,
  icon: Icon,
  label,
}: {
  ok: boolean;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 p-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
        ) : (
          <XCircle className="h-4 w-4 text-[hsl(var(--warning))]" />
        )}
        <span className="text-sm font-medium">
          {ok ? "Completado" : "Pendiente"}
        </span>
      </div>
    </div>
  );
}
