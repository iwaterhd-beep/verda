"use client";

import * as React from "react";
import {
  Check,
  X,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { fetchApplications, rejectApplication } from "@/lib/data/applications";
import { approveApplicationAction } from "./actions";
import { avatarUrl, formatDate } from "@/lib/utils";
import type { MemberApplication } from "@/types";

interface Credentials {
  name: string;
  email: string;
  password: string;
}

function ageFrom(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (365.25 * 864e5));
}

export default function SolicitudesPage() {
  const [applications, setApplications] = React.useState<MemberApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const [viewing, setViewing] = React.useState<MemberApplication | null>(null);
  const [rejecting, setRejecting] = React.useState<MemberApplication | null>(null);
  const [reason, setReason] = React.useState("");
  const [credentials, setCredentials] = React.useState<Credentials | null>(null);

  const reload = React.useCallback(() => {
    setLoading(true);
    fetchApplications()
      .then((data) => {
        setApplications(data);
        setError(null);
      })
      .catch((err) =>
        setError(
          err?.message ??
            "No se pudieron cargar las solicitudes. ¿Has ejecutado supabase/schema.sql?",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const pending = applications.filter((a) => a.status === "PENDING");
  const approved = applications.filter((a) => a.status === "APPROVED");
  const rejected = applications.filter((a) => a.status === "REJECTED");

  async function handleApprove(app: MemberApplication) {
    setBusy(true);
    try {
      const res = await approveApplicationAction(app.id);
      if (res.error) {
        toast.error("No se pudo aprobar", { description: res.error });
        return;
      }
      setViewing(null);
      setCredentials({
        name: app.fullName,
        email: res.email!,
        password: res.password!,
      });
      toast.success("Solicitud aprobada", {
        description: `${app.fullName} ya es socio activo.`,
      });
      reload();
    } catch (err) {
      toast.error("No se pudo aprobar", {
        description: (err as Error)?.message,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!rejecting) return;
    setBusy(true);
    try {
      await rejectApplication(rejecting.id, reason.trim() || undefined);
      toast.success("Solicitud rechazada", { description: rejecting.fullName });
      setRejecting(null);
      setReason("");
      setViewing(null);
      reload();
    } catch (err) {
      toast.error("No se pudo rechazar", {
        description: (err as Error)?.message,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        title="Solicitudes de alta"
        description="Revisa y verifica las solicitudes de nuevos socios."
      />

      {loading ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Cargando solicitudes…
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={reload}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pendientes
              {pending.length > 0 && (
                <Badge className="ml-2 h-5 px-1.5">{pending.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Aprobadas ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rechazadas ({rejected.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <List
              apps={pending}
              onView={setViewing}
              onApprove={handleApprove}
              onReject={setRejecting}
              emptyMsg="No hay solicitudes pendientes. Comparte el enlace /registro-socio para recibir altas."
            />
          </TabsContent>
          <TabsContent value="approved">
            <List apps={approved} onView={setViewing} emptyMsg="Aún no hay solicitudes aprobadas." />
          </TabsContent>
          <TabsContent value="rejected">
            <List apps={rejected} onView={setViewing} emptyMsg="No hay solicitudes rechazadas." />
          </TabsContent>
        </Tabs>
      )}

      {/* Detalle / fotos */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-xl">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.fullName}</DialogTitle>
                <DialogDescription>
                  {viewing.documentId} · {ageFrom(viewing.birthDate)} años ·{" "}
                  {viewing.locality}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Info icon={Mail} value={viewing.email} />
                <Info icon={Phone} value={viewing.phone} />
                <Info icon={MapPin} value={viewing.address} />
                <Info icon={Calendar} value={formatDate(viewing.birthDate)} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Photo src={viewing.facePhoto} label="Cara" />
                <Photo src={viewing.dniFront} label="DNI anverso" />
                <Photo src={viewing.dniBack} label="DNI reverso" />
              </div>
              {viewing.status === "PENDING" && (
                <DialogFooter className="gap-2 sm:gap-2">
                  <Button
                    variant="outline"
                    className="text-destructive"
                    onClick={() => setRejecting(viewing)}
                  >
                    <X className="h-4 w-4" /> Rechazar
                  </Button>
                  <Button disabled={busy} onClick={() => handleApprove(viewing)}>
                    <Check className="h-4 w-4" /> Aprobar y crear socio
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Motivo de rechazo */}
      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              Indica el motivo (opcional). Se notificará al solicitante.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Documentación ilegible, edad no verificable…"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setRejecting(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={busy} onClick={handleReject}>
              Rechazar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!credentials}
        onOpenChange={(o) => !o && setCredentials(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Socio dado de alta</DialogTitle>
            <DialogDescription>
              Comparte estas credenciales con {credentials?.name}. Podrá entrar
              en el portal de socios y cambiar su contraseña.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-mono">{credentials?.email}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Contraseña</span>
              <span className="font-mono">{credentials?.password}</span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() =>
                navigator.clipboard
                  .writeText(
                    `Acceso al portal de socios\nEmail: ${credentials?.email}\nContraseña: ${credentials?.password}\n${window.location.origin}/login`,
                  )
                  .then(() => toast.success("Credenciales copiadas"))
              }
            >
              Copiar
            </Button>
            <Button onClick={() => setCredentials(null)}>Hecho</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function List({
  apps,
  onView,
  onApprove,
  onReject,
  emptyMsg,
}: {
  apps: MemberApplication[];
  onView: (a: MemberApplication) => void;
  onApprove?: (a: MemberApplication) => void;
  onReject?: (a: MemberApplication) => void;
  emptyMsg: string;
}) {
  if (apps.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">{emptyMsg}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {apps.map((a) => (
        <Card key={a.id}>
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
            <Avatar className="h-12 w-12">
              {a.facePhoto ? (
                <AvatarImage src={a.facePhoto} alt={a.fullName} />
              ) : (
                <AvatarImage src={avatarUrl(a.fullName)} />
              )}
              <AvatarFallback>{a.fullName.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{a.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {a.documentId} · {a.locality} · {ageFrom(a.birthDate)} años ·
                enviada {formatDate(a.submittedAt, true)}
              </p>
              {a.status === "REJECTED" && a.rejectionReason && (
                <p className="mt-1 text-xs text-destructive">
                  Motivo: {a.rejectionReason}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onView(a)}>
                <Eye className="h-4 w-4" /> Ver
              </Button>
              {a.status === "PENDING" && onApprove && onReject && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => onReject(a)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => onApprove(a)}>
                    <Check className="h-4 w-4" /> Aprobar
                  </Button>
                </>
              )}
              {a.status === "APPROVED" && <Badge variant="success">Aprobada</Badge>}
              {a.status === "REJECTED" && (
                <Badge variant="destructive">Rechazada</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Info({ icon: Icon, value }: { icon: React.ElementType; value: string }) {
  return (
    <span className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate text-foreground/90">{value}</span>
    </span>
  );
}

function Photo({ src, label }: { src: string | null; label: string }) {
  return (
    <div>
      <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-secondary/40">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-xs text-muted-foreground">
            Sin foto
          </div>
        )}
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
