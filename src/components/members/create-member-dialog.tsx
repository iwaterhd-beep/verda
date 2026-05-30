"use client";

import * as React from "react";
import { UserPlus, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createMemberWithAccountAction } from "@/app/(dashboard)/socios/member-actions";
import { MemberInvitePanel } from "@/components/members/member-invite-panel";
import {
  MemberCredentialsDialog,
  type MemberCredentials,
} from "@/components/members/member-credentials-dialog";
import type { Member } from "@/types";

export function CreateMemberDialog() {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [credentials, setCredentials] = React.useState<MemberCredentials | null>(
    null,
  );
  const queryClient = useQueryClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fullName = String(form.get("fullName") || "").trim();
    const email = String(form.get("email") || "").trim();
    if (!fullName) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!email) {
      toast.error("El email es obligatorio", {
        description: "Se usa para crear el acceso al portal del socio.",
      });
      return;
    }
    const plan = String(form.get("plan") || "BASIC") as Member["membershipPlan"];
    setLoading(true);
    try {
      const res = await createMemberWithAccountAction({
        fullName,
        email,
        phone: String(form.get("phone") || ""),
        documentId: String(form.get("documentId") || ""),
        birthDate: String(form.get("birthDate") || "2000-01-01"),
        plan,
      });
      if (res.error) {
        toast.error("No se pudo crear el socio", { description: res.error });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setOpen(false);
      setCredentials({
        name: fullName,
        email: res.email!,
        password: res.password!,
      });
    } catch (err) {
      toast.error("No se pudo crear el socio", {
        description: err instanceof Error ? err.message : "Inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <UserPlus className="h-4 w-4" /> Nuevo socio
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo socio</DialogTitle>
            <DialogDescription>
              Invita con un enlace o regístralo manualmente con acceso al portal.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="invite">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invite">
                <Link2 className="mr-1.5 h-4 w-4" /> Enlace de invitación
              </TabsTrigger>
              <TabsTrigger value="manual">
                <UserPlus className="mr-1.5 h-4 w-4" /> Alta manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="invite" className="mt-4">
              <MemberInvitePanel />
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <form onSubmit={handleSubmit} className="grid gap-4">
                <p className="text-xs text-muted-foreground">
                  Se creará una cuenta en el portal y verás una contraseña
                  temporal para compartir con el socio.
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="Nombre y apellidos"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="email@…"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" name="phone" placeholder="+34…" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Documento</Label>
                    <Select name="documentType" defaultValue="DNI">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DNI">DNI</SelectItem>
                        <SelectItem value="NIE">NIE</SelectItem>
                        <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="documentId">Nº documento</Label>
                    <Input
                      id="documentId"
                      name="documentId"
                      placeholder="12345678A"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                    <Input id="birthDate" name="birthDate" type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Plan</Label>
                    <Select name="plan" defaultValue="BASIC">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BASIC">Básico</SelectItem>
                        <SelectItem value="PREMIUM">Premium</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-2 px-0">
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Crear socio
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <MemberCredentialsDialog
        credentials={credentials}
        open={Boolean(credentials)}
        onOpenChange={(o) => !o && setCredentials(null)}
      />
    </>
  );
}
