"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Package, Megaphone, Mail } from "lucide-react";
import { toast } from "sonner";
import { ProfileSubpage } from "@/components/portal/profile-subpage";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchMyOrders } from "@/lib/data/orders";
import { formatDate } from "@/lib/utils";
import {
  defaultNotificationPrefs,
  loadNotificationPrefs,
  loadReadNotificationIds,
  markAllNotificationsRead,
  markNotificationRead,
  saveNotificationPrefs,
  type MemberNotification,
  type NotificationPrefs,
} from "@/lib/member-notifications";

const statusLabels: Record<string, string> = {
  PREPARING: "En preparación",
  READY: "Listo para recoger",
  COMPLETED: "Entregado",
  CANCELLED: "Cancelado",
};

function notificationsFromOrders(
  orders: Awaited<ReturnType<typeof fetchMyOrders>>,
  readIds: Set<string>,
): MemberNotification[] {
  return orders.flatMap((order) => {
    const items: MemberNotification[] = [
      {
        id: `order-${order.id}-created`,
        title: `Pedido ${order.code}`,
        body: `Confirmado · ${statusLabels[order.status] ?? order.status}`,
        at: order.createdAt,
        read: readIds.has(`order-${order.id}-created`),
      },
    ];
    if (order.status === "READY") {
      items.unshift({
        id: `order-${order.id}-ready`,
        title: "¡Tu pedido está listo!",
        body: `Recógelo en el club con tu carnet QR · ${order.code}`,
        at: order.createdAt,
        read: readIds.has(`order-${order.id}-ready`),
      });
    }
    return items;
  });
}

export default function NotificacionesPage() {
  const [prefs, setPrefs] = React.useState<NotificationPrefs>(defaultNotificationPrefs);
  const [readIds, setReadIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    setPrefs(loadNotificationPrefs());
    setReadIds(loadReadNotificationIds());
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: fetchMyOrders,
  });

  const notifications = notificationsFromOrders(orders, readIds);
  const unread = notifications.filter((n) => !n.read).length;

  function updatePref<K extends keyof NotificationPrefs>(key: K, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    saveNotificationPrefs(next);
    toast.success("Preferencias guardadas");
  }

  function openNotification(n: MemberNotification) {
    markNotificationRead(n.id);
    setReadIds(loadReadNotificationIds());
  }

  function markAllRead() {
    markAllNotificationsRead(notifications.map((n) => n.id));
    setReadIds(loadReadNotificationIds());
    toast.success("Todas marcadas como leídas");
  }

  return (
    <ProfileSubpage
      title="Notificaciones"
      description="Avisos de pedidos y preferencias de comunicación."
    >
      <Card>
        <CardContent className="space-y-4 p-4">
          <p className="text-sm font-medium">Preferencias</p>
          <PrefRow
            icon={Package}
            label="Estado de pedidos"
            description="Cuando tu pedido esté listo para recoger"
            checked={prefs.orders}
            onCheckedChange={(v) => updatePref("orders", v)}
          />
          <PrefRow
            icon={Megaphone}
            label="Novedades del club"
            description="Menú, eventos y avisos generales"
            checked={prefs.clubNews}
            onCheckedChange={(v) => updatePref("clubNews", v)}
          />
          <PrefRow
            icon={Mail}
            label="Email"
            description="Recibir copia por correo cuando esté disponible"
            checked={prefs.email}
            onCheckedChange={(v) => updatePref("email", v)}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Recientes</p>
        {unread > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={markAllRead}>
            Marcar todo leído
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Cargando…
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No tienes notificaciones todavía.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => openNotification(n)}
              className="w-full text-left"
            >
              <Card
                className={
                  n.read ? "opacity-80" : "border-primary/30 bg-primary/5"
                }
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{n.title}</p>
                      {!n.read && (
                        <Badge variant="default" className="h-5 text-[10px]">
                          Nuevo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(n.at, true)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </ProfileSubpage>
  );
}

function PrefRow({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <div className="flex-1">
        <Label className="text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
