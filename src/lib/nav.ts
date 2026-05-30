import {
  LayoutDashboard,
  Users,
  UserPlus,
  ScanLine,
  Boxes,
  ShoppingCart,
  ClipboardList,
  CalendarDays,
  MessageSquare,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    label: "General",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Socios", href: "/socios", icon: Users, badge: "128" },
      { title: "Solicitudes", href: "/solicitudes", icon: UserPlus },
      { title: "Control de acceso", href: "/acceso", icon: ScanLine },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { title: "Inventario", href: "/inventario", icon: Boxes, badge: "2" },
      { title: "Pedidos", href: "/pedidos", icon: ClipboardList },
      { title: "TPV", href: "/tpv", icon: ShoppingCart },
      { title: "Reservas", href: "/reservas", icon: CalendarDays },
    ],
  },
  {
    label: "Gestión",
    items: [
      { title: "Comunicación", href: "/comunicacion", icon: MessageSquare },
      { title: "Legal y RGPD", href: "/legal", icon: ShieldCheck },
      { title: "Configuración", href: "/configuracion", icon: Settings },
    ],
  },
];
