"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Boxes,
  ClipboardList,
  Loader2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchStaffNotificationSources } from "@/lib/data/staff-notifications";
import {
  buildStaffNotifications,
  loadStaffReadNotificationIds,
  markAllStaffNotificationsRead,
  markStaffNotificationRead,
  type StaffNotification,
  type StaffNotificationKind,
} from "@/lib/staff-notifications";
import { cn, relativeTime } from "@/lib/utils";

const kindIcon: Record<StaffNotificationKind, React.ElementType> = {
  application: UserPlus,
  order_preparing: ClipboardList,
  order_ready: ClipboardList,
  low_stock: Boxes,
};

export function NotificationsMenu() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [readIds, setReadIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    setReadIds(loadStaffReadNotificationIds());
  }, []);

  const { data: sources, isLoading, refetch } = useQuery({
    queryKey: ["staff-notifications"],
    queryFn: fetchStaffNotificationSources,
    refetchInterval: 30_000,
  });

  const notifications = React.useMemo(
    () =>
      sources ? buildStaffNotifications(sources, readIds) : [],
    [sources, readIds],
  );

  const unread = notifications.filter((n) => !n.read).length;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) void refetch();
  }

  function openNotification(notification: StaffNotification) {
    markStaffNotificationRead(notification.id);
    setReadIds((prev) => new Set(prev).add(notification.id));
    setOpen(false);
    router.push(notification.href);
  }

  function markAllRead() {
    markAllStaffNotificationsRead(notifications.map((n) => n.id));
    setReadIds(new Set(notifications.map((n) => n.id)));
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unread > 0
              ? `Notificaciones, ${unread} sin leer`
              : "Notificaciones"
          }
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] font-semibold text-primary-foreground ring-2 ring-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)] p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold text-foreground">
            Notificaciones
          </DropdownMenuLabel>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-medium text-primary hover:underline"
            >
              Marcar todas leídas
            </button>
          )}
        </div>

        <div className="max-h-[min(60vh,360px)] overflow-y-auto p-1.5">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="mt-2 text-sm text-muted-foreground">
                No hay notificaciones pendientes
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = kindIcon[notification.kind];
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex-col items-start gap-1 py-2.5",
                    !notification.read && "bg-primary/5",
                  )}
                  onSelect={(event) => {
                    event.preventDefault();
                    openNotification(notification);
                  }}
                >
                  <div className="flex w-full items-start gap-2">
                    <span
                      className={cn(
                        "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                        notification.read
                          ? "bg-secondary text-muted-foreground"
                          : "bg-primary/15 text-primary",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <Badge variant="default" className="h-4 shrink-0 px-1.5 text-[9px]">
                            Nueva
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {notification.body}
                      </p>
                      <p className="mt-1 text-[0.65rem] text-muted-foreground/80">
                        {relativeTime(notification.at)}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />
        <div className="p-1.5">
          <DropdownMenuItem asChild className="justify-center text-primary">
            <Link href="/pedidos">Ver todos los pedidos</Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
