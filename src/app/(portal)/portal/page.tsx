"use client";

import Link from "next/link";
import { QrCode, Wallet, Leaf, ArrowRight, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PlanBadge } from "@/components/members/status-badge";
import { ProductCard } from "@/components/portal/product-card";
import { useQuery } from "@tanstack/react-query";
import { currentMember } from "@/lib/current-member";
import { fetchMyMember } from "@/lib/data/members";
import { products } from "@/lib/mock-data";
import { avatarUrl, formatCurrency } from "@/lib/utils";

export default function PortalHomePage() {
  const { data } = useQuery({ queryKey: ["my-member"], queryFn: fetchMyMember });
  const m = data ?? currentMember;
  const pct = Math.round((m.consumedThisMonth / m.consumptionLimit) * 100);
  const featured = products.filter((p) => p.stock > 0).slice(0, 3);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 rounded-2xl">
            <AvatarImage src={avatarUrl(m.avatarSeed)} />
            <AvatarFallback>{m.fullName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-muted-foreground">Hola,</p>
            <p className="font-semibold leading-none">
              {m.fullName.split(" ")[0]}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary" />
        </Button>
      </header>

      {/* Carnet digital */}
      <Card className="border-glow overflow-hidden">
        <CardContent className="relative p-5">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <PlanBadge plan={m.membershipPlan} />
                <Badge variant="success">Activo</Badge>
              </div>
              <p className="mt-3 text-lg font-semibold">{m.fullName}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {m.qrCode}
              </p>
            </div>
            <div className="grid h-20 w-20 place-items-center rounded-xl bg-background/60 ring-1 ring-border">
              <QrCode className="h-14 w-14" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" /> Monedero
            </span>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(m.walletBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Leaf className="h-3.5 w-3.5" /> Consumo mensual
            </span>
            <p className="mt-1 text-xl font-semibold">
              {m.consumedThisMonth}
              <span className="text-sm text-muted-foreground">
                /{m.consumptionLimit}g
              </span>
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA menú */}
      <Link href="/portal/menu">
        <Card className="transition-colors hover:border-primary/40">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-2xl">
              🌿
            </span>
            <div className="flex-1">
              <p className="font-medium">Hacer un pedido</p>
              <p className="text-xs text-muted-foreground">
                Explora el menú y recoge en el club
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      {/* Destacados */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Destacados</h2>
          <Link
            href="/portal/menu"
            className="text-sm text-primary hover:underline"
          >
            Ver todo
          </Link>
        </div>
        <div className="space-y-3">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
