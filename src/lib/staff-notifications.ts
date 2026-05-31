export type StaffNotificationKind =
  | "application"
  | "order_preparing"
  | "order_ready"
  | "low_stock";

export interface StaffNotification {
  id: string;
  kind: StaffNotificationKind;
  title: string;
  body: string;
  at: string;
  href: string;
  read: boolean;
}

export interface StaffNotificationSources {
  applications: {
    id: string;
    fullName: string;
    submittedAt: string;
  }[];
  orders: {
    id: string;
    code: string;
    status: "PREPARING" | "READY";
    memberName: string;
    createdAt: string;
  }[];
  lowStock: {
    id: string;
    name: string;
    stock: number;
    threshold: number;
  }[];
}

const READ_KEY = "verda-staff-notif-read";

export function loadStaffReadNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function markStaffNotificationRead(id: string) {
  const read = loadStaffReadNotificationIds();
  read.add(id);
  localStorage.setItem(READ_KEY, JSON.stringify([...read]));
}

export function markAllStaffNotificationsRead(ids: string[]) {
  const read = loadStaffReadNotificationIds();
  ids.forEach((id) => read.add(id));
  localStorage.setItem(READ_KEY, JSON.stringify([...read]));
}

export function buildStaffNotifications(
  sources: StaffNotificationSources,
  readIds: Set<string>,
): StaffNotification[] {
  const items: StaffNotification[] = [];

  for (const app of sources.applications) {
    items.push({
      id: `app-${app.id}`,
      kind: "application",
      title: "Nueva solicitud de socio",
      body: `${app.fullName} quiere unirse al club`,
      at: app.submittedAt,
      href: "/solicitudes",
      read: readIds.has(`app-${app.id}`),
    });
  }

  for (const order of sources.orders) {
    if (order.status === "PREPARING") {
      items.push({
        id: `order-prep-${order.id}`,
        kind: "order_preparing",
        title: "Pedido por preparar",
        body: `${order.code} · ${order.memberName}`,
        at: order.createdAt,
        href: "/pedidos",
        read: readIds.has(`order-prep-${order.id}`),
      });
    }
    if (order.status === "READY") {
      items.push({
        id: `order-ready-${order.id}`,
        kind: "order_ready",
        title: "Pedido listo para recoger",
        body: `${order.code} · ${order.memberName}`,
        at: order.createdAt,
        href: "/pedidos",
        read: readIds.has(`order-ready-${order.id}`),
      });
    }
  }

  for (const product of sources.lowStock) {
    items.push({
      id: `stock-${product.id}`,
      kind: "low_stock",
      title: "Stock bajo",
      body: `${product.name}: ${product.stock} (umbral ${product.threshold})`,
      at: new Date().toISOString(),
      href: "/inventario",
      read: readIds.has(`stock-${product.id}`),
    });
  }

  return items.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}
