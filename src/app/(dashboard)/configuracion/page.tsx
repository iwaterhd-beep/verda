"use client";

import { Palette, Building2, Users2, Plug, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const roles = [
  { name: "Super admin", desc: "Acceso total a todos los clubes", count: 1 },
  { name: "Admin club", desc: "Gestión completa de un club", count: 3 },
  { name: "Empleado", desc: "TPV, accesos e inventario", count: 8 },
  { name: "Socio", desc: "App de socio y reservas", count: 128 },
];

const integrations = [
  { name: "Stripe", desc: "Pagos y suscripciones", connected: true },
  { name: "Resend", desc: "Email transaccional", connected: true },
  { name: "Twilio", desc: "SMS y WhatsApp", connected: false },
  { name: "Google Calendar", desc: "Sincronizar reservas", connected: false },
];

export default function ConfiguracionPage() {
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        title="Configuración"
        description="Branding, multi-club, usuarios, permisos e integraciones."
      />

      <Tabs defaultValue="branding">
        <TabsList className="flex-wrap">
          <TabsTrigger value="branding">
            <Palette className="mr-1.5 h-4 w-4" /> Branding
          </TabsTrigger>
          <TabsTrigger value="club">
            <Building2 className="mr-1.5 h-4 w-4" /> Club
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Users2 className="mr-1.5 h-4 w-4" /> Usuarios
          </TabsTrigger>
          <TabsTrigger value="integraciones">
            <Plug className="mr-1.5 h-4 w-4" /> Integraciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Identidad del club</CardTitle>
              <CardDescription>
                Personaliza el aspecto del panel y la app de socios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Nombre del club</Label>
                  <Input defaultValue="Club Verde" />
                </div>
                <div className="grid gap-2">
                  <Label>Subdominio</Label>
                  <Input defaultValue="clubverde.verda.app" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Color de marca</Label>
                <div className="flex gap-2">
                  {["#22c55e", "#10b981", "#16a34a", "#0ea5e9", "#8b5cf6"].map(
                    (c) => (
                      <button
                        key={c}
                        className="h-9 w-9 rounded-xl ring-2 ring-transparent transition-all hover:ring-ring"
                        style={{ background: c }}
                      />
                    ),
                  )}
                </div>
              </div>
              <Button onClick={() => toast.success("Branding guardado")}>
                Guardar cambios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="club">
          <Card>
            <CardHeader>
              <CardTitle>Multi-club</CardTitle>
              <CardDescription>
                Gestiona varias sedes desde una única cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Club Verde · Barcelona", "Club Verde · Madrid"].map((club, i) => (
                <div
                  key={club}
                  className="flex items-center justify-between rounded-xl border border-border/60 p-3"
                >
                  <span className="font-medium">{club}</span>
                  <Badge variant={i === 0 ? "success" : "secondary"}>
                    {i === 0 ? "Activo" : "En configuración"}
                  </Badge>
                </div>
              ))}
              <Button variant="outline">+ Añadir club</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Roles y permisos</CardTitle>
              <CardDescription>Control de acceso basado en roles (RBAC).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {roles.map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between rounded-xl border border-border/60 p-3"
                >
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                  <Badge variant="secondary">{r.count} usuarios</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integraciones">
          <Card>
            <CardHeader>
              <CardTitle>Integraciones</CardTitle>
              <CardDescription>Conecta Verda con tus herramientas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {integrations.map((i) => (
                <div
                  key={i.name}
                  className="flex items-center justify-between rounded-xl border border-border/60 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary font-semibold">
                      {i.name[0]}
                    </span>
                    <div>
                      <p className="font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground">{i.desc}</p>
                    </div>
                  </div>
                  {i.connected ? (
                    <Badge variant="success">
                      <Check className="h-3 w-3" /> Conectado
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm">
                      Conectar
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
