"use client";

import * as React from "react";
import { Send, Mail, Bell, MessageSquare, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { relativeTime } from "@/lib/utils";

const channels = [
  { id: "push", label: "Push", icon: Bell },
  { id: "email", label: "Email", icon: Mail },
  { id: "internal", label: "Mensaje interno", icon: MessageSquare },
];

const sent = [
  { id: 1, title: "Nuevo lote disponible 🌿", audience: "Todos los socios", at: "2026-05-29T11:00:00" },
  { id: 2, title: "Recordatorio renovación", audience: "Membresías por caducar", at: "2026-05-28T09:30:00" },
  { id: 3, title: "Fiesta aniversario del club", audience: "Socios VIP", at: "2026-05-25T18:00:00" },
];

export default function ComunicacionPage() {
  const [message, setMessage] = React.useState("");

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Comunicación"
        description="Notificaciones push, email, mensajes internos y avisos a socios."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Nuevo aviso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Audiencia</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los socios</SelectItem>
                  <SelectItem value="active">Socios activos</SelectItem>
                  <SelectItem value="vip">Socios VIP</SelectItem>
                  <SelectItem value="expiring">Membresías por caducar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" placeholder="Título del aviso" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="msg">Mensaje</Label>
              <textarea
                id="msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Escribe tu mensaje…"
                className="flex w-full rounded-xl border border-input bg-secondary/40 px-3.5 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label>Canales</Label>
              {channels.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 p-3"
                >
                  <span className="flex items-center gap-2.5 text-sm">
                    <c.icon className="h-4 w-4 text-primary" /> {c.label}
                  </span>
                  <Switch defaultChecked={c.id !== "internal"} />
                </div>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={() =>
                toast.success("Aviso enviado", {
                  description: "Se notificará a la audiencia seleccionada.",
                })
              }
            >
              <Send className="h-4 w-4" /> Enviar aviso
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Enviados recientemente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sent.map((s) => (
              <div
                key={s.id}
                className="flex items-start gap-3 rounded-xl border border-border/60 p-3"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Megaphone className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <Badge variant="secondary" className="mt-1">
                    {s.audience}
                  </Badge>
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {relativeTime(s.at)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
