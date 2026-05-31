"use client";

import Link from "next/link";
import { Wallet, ArrowRight, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemberAvatarPicker } from "@/components/portal/member-avatar-picker";
import { ProductCard } from "@/components/portal/product-card";
import { MemberQrCard } from "@/components/portal/member-qr-card";
import { useQuery } from "@tanstack/react-query";
import { currentMember } from "@/lib/current-member";
import { fetchMyMember } from "@/lib/data/members";
import { fetchClubProducts } from "@/lib/data/products";
import { formatCurrency } from "@/lib/utils";

export default function PortalHomePage() {
  const { data } = useQuery({ queryKey: ["my-member"], queryFn: fetchMyMember });
  const m = data ?? currentMember;
  const { data: menuProducts = [] } = useQuery({
    queryKey: ["portal-products"],
    queryFn: fetchClubProducts,
  });
  const featured = menuProducts.filter((p) => p.stock > 0).slice(0, 3);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MemberAvatarPicker member={m} size="md" editable={false} />
          <div>
            <p className="text-sm text-muted-foreground">Hola,</p>
            <p className="font-semibold leading-none">
              {m.fullName.split(" ")[0]}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="touch-target relative" asChild>
          <Link href="/portal/perfil/notificaciones" aria-label="Notificaciones">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary" />
          </Link>
        </Button>
      </header>

      <Link href="/portal/perfil/carnet" className="block">
        <MemberQrCard member={m} showActions={false} />
      </Link>

      {/* Monedero */}
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
          {featured.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay productos disponibles en el menú.
            </p>
          ) : (
            featured.map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </div>
      </div>
    </div>
  );
}
