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
  const [pendingCount, setPendingCount] = React.useState(0);
  const [orderCount, setOrderCount] = React.useState(0);

  React.useEffect(() => {
    const supabase = createClient();
    supabase
      .from("member_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "PENDING")
      .then(({ count }) => setPendingCount(count ?? 0));
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "PREPARING")
      .then(({ count }) => setOrderCount(count ?? 0));
  }, [pathname]);

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
            const badge =
              item.href === "/solicitudes"
                ? pendingCount > 0
                  ? String(pendingCount)
                  : undefined
                : item.href === "/pedidos"
                  ? orderCount > 0
                    ? String(orderCount)
                    : undefined
                  : item.badge;
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
                      item.href === "/solicitudes" || item.href === "/pedidos"
                        ? "success"
                        : active
                          ? "default"
                          : "secondary"
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
