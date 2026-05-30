import {
  LayoutDashboard,
  Building2,
  Users2,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface SuperAdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const superAdminNavItems: SuperAdminNavItem[] = [
  { title: "Plataforma", href: "/super-admin", icon: LayoutDashboard },
  { title: "Clubs", href: "/super-admin/clubs", icon: Building2 },
  { title: "Usuarios", href: "/super-admin/users", icon: Users2 },
  { title: "Configuración", href: "/super-admin/settings", icon: Settings },
];
