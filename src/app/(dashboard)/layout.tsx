"use client";

import * as React from "react";
import Link from "next/link";
import { X, ChevronsUpDown, Check } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Topbar } from "@/components/dashboard/topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewOrderAlerts } from "@/components/dashboard/new-order-alerts";

function ClubSwitcher() {
  return (
    <button className="flex w-full items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 p-2 text-left transition-colors hover:bg-secondary/70">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">
        CV
      </span>
      <div className="flex-1 leading-tight">
        <p className="text-sm font-medium">Club Verde</p>
        <p className="text-xs text-muted-foreground">Barcelona · Plan Pro</p>
      </div>
      <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      <NewOrderAlerts />
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-border/60 bg-card/30 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <div className="px-3">
          <ClubSwitcher />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <SidebarNav />
        </div>
        <UpgradeCard />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-border bg-card animate-fade-up">
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
            <div className="px-3">
              <ClubSwitcher />
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
            <UpgradeCard />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:pl-[260px]">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function UpgradeCard() {
  return (
    <div className="m-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-4">
      <Badge variant="success" className="mb-2">
        <Check className="h-3 w-3" /> Plan Pro
      </Badge>
      <p className="text-sm font-medium">Clubes ilimitados</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Desbloquea automatizaciones, analytics e IA.
      </p>
      <Button size="sm" className="mt-3 w-full">
        Mejorar plan
      </Button>
    </div>
  );
}
