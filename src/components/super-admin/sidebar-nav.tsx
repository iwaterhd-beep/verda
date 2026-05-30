"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { superAdminNavItems } from "@/lib/super-admin-nav";
import { cn } from "@/lib/utils";

export function SuperAdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      <p className="px-3 pb-2 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground/70">
        Plataforma Verda
      </p>
      {superAdminNavItems.map((item) => {
        const active =
          item.href === "/super-admin"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
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
                "h-[18px] w-[18px] shrink-0",
                active ? "text-primary" : "text-muted-foreground",
              )}
            />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
