"use client";

import Link from "next/link";
import { Wallet, ArrowRight, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemberAvatarPicker } from "@/components/portal/member-avatar-picker";
import { PortalThemeToggle } from "@/components/portal/portal-theme-toggle";
import { ProductCard } from "@/components/portal/product-card";
import { MemberQrCard } from "@/components/portal/member-qr-card";
import { useQuery } from "@tanstack/react-query";
import { currentMember } from "@/lib/current-member";
import { fetchMyMember } from "@/lib/data/members";
import { fetchPortalProducts } from "@/lib/data/products";
import { fetchClubFarms, fetchFarmGenetics } from "@/lib/data/product-farms";
import { fetchClubJars, fetchJarItems } from "@/lib/data/product-jars";
import { PortalFarmCard } from "@/components/portal/portal-farm-card";
import { PortalJarCard } from "@/components/portal/portal-jar-card";
import { formatCurrency, walletBalanceTone, cn } from "@/lib/utils";

export default function PortalHomePage() {
  const { data } = useQuery({ queryKey: ["my-member"], queryFn: fetchMyMember });
  const m = data ?? currentMember;
  const { data: menuProducts = [] } = useQuery({
    queryKey: ["portal-products"],
    queryFn: fetchPortalProducts,
  });
  const { data: farms = [], isError: farmsError, isLoading: farmsLoading } = useQuery({
    queryKey: ["club-farms"],
    queryFn: fetchClubFarms,
  });
  const { data: genetics = [] } = useQuery({
    queryKey: ["farm-genetics-all"],
    queryFn: () => fetchFarmGenetics(),
  });
  const { data: jars = [], isError: jarsError, isLoading: jarsLoading } = useQuery({
    queryKey: ["club-jars"],
    queryFn: fetchClubJars,
  });
  const { data: jarItems = [] } = useQuery({
    queryKey: ["jar-items-all"],
    queryFn: () => fetchJarItems(),
  });
  const featured = menuProducts.filter((p) => p.stock > 0).slice(0, 3);

  const geneticsByFarm = genetics.reduce<Map<string, number>>((map, g) => {
    map.set(g.farmId, (map.get(g.farmId) ?? 0) + 1);
    return map;
  }, new Map());

  const itemsByJar = jarItems.reduce<Map<string, number>>((map, item) => {
    map.set(item.jarId, (map.get(item.jarId) ?? 0) + 1);
    return map;
  }, new Map());

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
        <div className="flex items-center gap-1">
          <PortalThemeToggle />
          <Button variant="ghost" size="icon" className="touch-target relative" asChild>
            <Link href="/portal/perfil/notificaciones" aria-label="Notificaciones">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary" />
            </Link>
          </Button>
        </div>
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
          <p className={cn("mt-1 text-xl font-semibold", walletBalanceTone(m.walletBalance))}>
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

      {farmsLoading ? null : farms.length > 0 ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Farms</h2>
            <Link
              href="/portal/menu"
              className="text-sm text-primary hover:underline"
            >
              Ver menú
            </Link>
          </div>
          <div className="space-y-2">
            {farms.map((farm) => (
              <PortalFarmCard
                key={farm.id}
                farm={farm}
                geneticsCount={geneticsByFarm.get(farm.id) ?? 0}
              />
            ))}
          </div>
        </div>
      ) : farmsError ? (
        <p className="text-center text-sm text-muted-foreground">
          No se pudieron cargar las farms.
        </p>
      ) : null}

      {jarsLoading ? null : jars.length > 0 ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Jars</h2>
            <Link
              href="/portal/menu"
              className="text-sm text-primary hover:underline"
            >
              Ver menú
            </Link>
          </div>
          <div className="space-y-2">
            {jars.map((j) => (
              <PortalJarCard
                key={j.id}
                jar={j}
                itemsCount={itemsByJar.get(j.id) ?? 0}
              />
            ))}
          </div>
        </div>
      ) : jarsError ? (
        <p className="text-center text-sm text-muted-foreground">
          No se pudieron cargar los jars.
        </p>
      ) : null}

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
