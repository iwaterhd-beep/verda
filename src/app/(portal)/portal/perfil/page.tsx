"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { changePasswordAction } from "@/app/(portal)/portal/actions";
import {
  Mail,
  Phone,
  FileText,
  QrCode,
  ShieldCheck,
  Wallet,
  LogOut,
  ChevronRight,
  Bell,
  KeyRound,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemberAvatarPicker } from "@/components/portal/member-avatar-picker";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlanBadge, StatusBadge } from "@/components/members/status-badge";
import { useQuery } from "@tanstack/react-query";
import { currentMember } from "@/lib/current-member";
import { fetchMyMember } from "@/lib/data/members";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PerfilPage() {
  const { data } = useQuery({ queryKey: ["my-member"], queryFn: fetchMyMember });
  const m = data ?? currentMember;
  const [pwdOpen, setPwdOpen] = React.useState(false);
  const [pwd, setPwd] = React.useState("");
  const [pwdBusy, setPwdBusy] = React.useState(false);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdBusy(true);
    const res = await changePasswordAction(pwd);
    setPwdBusy(false);
    if (res.error) {
      toast.error("No se pudo cambiar la contraseña", { description: res.error });
      return;
    }
    toast.success("Contraseña actualizada");
    setPwd("");
    setPwdOpen(false);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>

      <Card>
        <CardContent className="flex flex-col items-center p-6 text-center">
          <MemberAvatarPicker member={m} size="lg" />
          <p className="mt-2 text-xs text-muted-foreground">
            Toca tu foto para cambiarla
          </p>
          <p className="mt-1 text-lg font-semibold">{m.fullName}</p>
          <div className="mt-2 flex gap-2">
            <PlanBadge plan={m.membershipPlan} />
            <StatusBadge status={m.status} />
          </div>
          <div className="mt-4 grid w-full grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl border border-border/60 p-3">
              <span className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" /> Monedero
              </span>
              <p className="mt-1 font-semibold">
                {formatCurrency(m.walletBalance)}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <span className="text-xs text-muted-foreground">Socio desde</span>
              <p className="mt-1 font-semibold">{formatDate(m.joinedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-2">
          <Row icon={Mail} label={m.email} />
          <Separator />
          <Row icon={Phone} label={m.phone} />
          <Separator />
          <Row
            icon={FileText}
            label={`${m.documentType} · ${m.documentId}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-2">
          <ActionRow
            icon={QrCode}
            label="Mi carnet digital"
            href="/portal/perfil/carnet"
          />
          <Separator />
          <ActionRow
            icon={FileText}
            label="Mis documentos y consentimientos"
            href="/portal/perfil/documentos"
          />
          <Separator />
          <ActionRow
            icon={Bell}
            label="Notificaciones"
            href="/portal/perfil/notificaciones"
          />
          <Separator />
          <button
            type="button"
            onClick={() => setPwdOpen(true)}
            className="flex min-h-12 w-full touch-manipulation items-center gap-3 rounded-xl px-3 text-sm transition-colors hover:bg-secondary/60 active:bg-secondary/80"
          >
            <KeyRound className="h-4 w-4 text-primary" />
            <span className="flex-1 text-left">Cambiar contraseña</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <Separator />
          <ActionRow
            icon={ShieldCheck}
            label="Privacidad y RGPD"
            href="/portal/perfil/privacidad"
          />
        </CardContent>
      </Card>

      <form action={signOut}>
        <Button
          type="submit"
          variant="outline"
          className="min-h-12 w-full touch-manipulation text-destructive"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </Button>
      </form>

      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent className="portal-dialog gap-0 p-0 sm:max-w-sm">
          <form onSubmit={handlePassword} className="p-6">
            <DialogHeader>
              <DialogTitle>Nueva contraseña</DialogTitle>
              <DialogDescription>
                Mínimo 8 caracteres. La usarás para entrar al portal.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 grid gap-2">
              <Label htmlFor="new-password">Contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <DialogFooter className="gap-2 pt-2 sm:gap-2">
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 touch-manipulation"
                onClick={() => setPwdOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="min-h-11 touch-manipulation" disabled={pwdBusy}>
                {pwdBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex min-h-12 items-center gap-3 px-3 py-2 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function ActionRow({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-12 touch-manipulation items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-secondary/60 active:bg-secondary/80"
    >
      <Icon className="h-4 w-4 text-primary" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
