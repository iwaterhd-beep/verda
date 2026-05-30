"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SuperAdminSidebar } from "@/components/super-admin/sidebar-nav";
import { SuperAdminUserMenu } from "@/components/super-admin/user-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-border/60 bg-card/30 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <Link href="/super-admin">
            <Logo />
          </Link>
          <Badge variant="secondary" className="text-[0.65rem]">
            Super
          </Badge>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <SuperAdminSidebar />
        </div>
        <div className="m-3 rounded-2xl border border-border/60 bg-secondary/30 p-4 text-xs text-muted-foreground">
          Vista global de todos los clubs registrados en Verda.
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-border bg-card">
            <div className="flex h-16 items-center justify-between px-5">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SuperAdminSidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <p className="hidden text-sm text-muted-foreground lg:block">
            Panel de plataforma · Super admin
          </p>
          <SuperAdminUserMenu />
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
