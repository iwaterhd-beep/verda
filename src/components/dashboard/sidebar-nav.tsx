"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navSections } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [activeMembers, setActiveMembers] = React.useState(0);
  const [pendingApps, setPendingApps] = React.useState(0);
  const [lowStockCount, setLowStockCount] = React.useState(0);
  const [preparingOrders, setPreparingOrders] = React.useState(0);

  React.useEffect(() => {
    async function loadCounts() {
      const supabase = createClient();

      const [membersRes, appsRes, productsRes, ordersRes] = await Promise.all([
        supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("status", "ACTIVE"),
        supabase
          .from("member_applications")
          .select("id", { count: "exact", head: true })
          .eq("status", "PENDING"),
        supabase.from("products").select("stock, low_stock_threshold"),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "PREPARING"),
      ]);

      setActiveMembers(membersRes.count ?? 0);
      setPendingApps(appsRes.count ?? 0);
      setPreparingOrders(ordersRes.count ?? 0);

      const low = (productsRes.data ?? []).filter(
        (p) => Number(p.stock) < Number(p.low_stock_threshold),
      ).length;
      setLowStockCount(low);
    }

    void loadCounts();
  }, [pathname]);

  function badgeFor(href: string): { text?: string; variant: "default" | "secondary" | "success" | "warning" } {
    switch (href) {
      case "/socios":
        return { text: String(activeMembers), variant: "secondary" };
      case "/solicitudes":
        return pendingApps > 0
          ? { text: String(pendingApps), variant: "success" }
          : { variant: "secondary" };
      case "/inventario":
        return lowStockCount > 0
          ? { text: String(lowStockCount), variant: "warning" }
          : { variant: "secondary" };
      case "/pedidos":
        return preparingOrders > 0
          ? { text: String(preparingOrders), variant: "success" }
          : { variant: "secondary" };
      default:
        return { variant: "secondary" };
    }
  }

  return (
    <nav className="flex flex-1 flex-col gap-6 px-3 py-4">
      {navSections.map((section) => (
        <div key={section.label} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground/70">
            {section.label}
          </p>
          {section.items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const { text: badge, variant: badgeVariant } = badgeFor(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span className="flex-1">{item.title}</span>
                {badge && (
                  <Badge
                    variant={
                      badgeVariant === "secondary" && active
                        ? "default"
                        : badgeVariant
                    }
                    className="h-5 px-1.5 text-[0.65rem]"
                  >
                    {badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
