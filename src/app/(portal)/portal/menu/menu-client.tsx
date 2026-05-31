"use client";

import * as React from "react";
import { Search, Loader2, Sprout } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/portal/product-card";
import { FarmGeneticCard } from "@/components/portal/farm-genetic-card";
import { CartBar } from "@/components/portal/cart-bar";
import { fetchPortalProducts } from "@/lib/data/products";
import { fetchClubCategories } from "@/lib/data/product-categories";
import {
  fetchClubFarms,
  fetchFarmGenetics,
  fetchPortalFarmGenetics,
} from "@/lib/data/product-farms";
import { getCategoryDisplay, categoryChipStyle } from "@/lib/product-meta";
import { PortalFarmCard } from "@/components/portal/portal-farm-card";
import { useCart } from "@/store/use-cart";
import { cn } from "@/lib/utils";

export function MenuPageClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("ALL");
  const [farm, setFarm] = React.useState<string>("ALL");
  const cartCount = useCart((s) => s.count());

  React.useEffect(() => {
    const fromUrl = searchParams.get("farm");
    if (fromUrl) setFarm(fromUrl);
  }, [searchParams]);

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["portal-products"],
    queryFn: fetchPortalProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["club-categories"],
    queryFn: fetchClubCategories,
  });

  const { data: farms = [] } = useQuery({
    queryKey: ["club-farms"],
    queryFn: fetchClubFarms,
  });

  const { data: allGenetics = [] } = useQuery({
    queryKey: ["farm-genetics-all"],
    queryFn: () => fetchFarmGenetics(),
  });

  const { data: farmGenetics = [], isLoading: geneticsLoading } = useQuery({
    queryKey: ["portal-farm-genetics", farm, products.map((p) => p.id).join(",")],
    queryFn: () =>
      fetchPortalFarmGenetics(products, farm === "ALL" ? undefined : farm),
    enabled: farm !== "ALL" && !isLoading,
  });

  const availableCategories = categories.filter((c) =>
    products.some((p) => p.category === c.id),
  );

  const geneticsByFarm = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const g of allGenetics) {
      map.set(g.farmId, (map.get(g.farmId) ?? 0) + 1);
    }
    return map;
  }, [allGenetics]);

  const filteredProducts = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    const matchesCat = category === "ALL" || p.category === category;
    const matchesFarm = farm === "ALL" || p.farmId === farm;
    return matchesQuery && matchesCat && matchesFarm;
  });

  const filteredGenetics = farmGenetics.filter((g) => {
    const matchesQuery = g.name.toLowerCase().includes(query.toLowerCase());
    const matchesFarm = farm === "ALL" || g.farmId === farm;
    return matchesQuery && matchesFarm;
  });

  const useGeneticView = farm !== "ALL";

  const farmsById = Object.fromEntries(farms.map((f) => [f.id, f.name]));

  return (
    <div
      className={cn(
        "space-y-4",
        cartCount > 0 && "pb-[calc(var(--portal-cart-bar-height)+0.75rem)]",
      )}
    >
      <h1 className="text-2xl font-semibold tracking-tight">Menú</h1>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto…"
          className="pl-9"
          inputMode="search"
          enterKeyHint="search"
        />
      </div>

      <div className="space-y-2">
        <p className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Categorías
        </p>
        <div className="portal-scroll-x -mx-4 flex gap-2 px-4 pb-1">
          <Chip active={category === "ALL"} onClick={() => setCategory("ALL")}>
            Todo
          </Chip>
          {availableCategories.map((c) => {
            const display = getCategoryDisplay(c.id, categories);
            return (
              <Chip
                key={c.id}
                active={category === c.id}
                accentColor={display.color}
                onClick={() => setCategory(c.id)}
              >
                {display.emoji} {display.label}
              </Chip>
            );
          })}
        </div>
      </div>

      {farms.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Sprout className="h-3 w-3" />
            Farms
          </p>
          <div className="portal-scroll-x -mx-4 flex gap-2 px-4 pb-1">
            <Chip
              active={farm === "ALL"}
              onClick={() => setFarm("ALL")}
              accentColor="#10b981"
            >
              Todas
            </Chip>
            {farms.map((f) => (
              <Chip
                key={f.id}
                active={farm === f.id}
                accentColor="#10b981"
                onClick={() => setFarm(f.id)}
              >
                🌱 {f.name}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {farm === "ALL" && farms.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Explorar por farm</p>
          <div className="space-y-2">
            {farms.map((f) => (
              <PortalFarmCard
                key={f.id}
                farm={f}
                geneticsCount={geneticsByFarm.get(f.id) ?? 0}
                onSelect={setFarm}
              />
            ))}
          </div>
        </div>
      )}

      {isLoading || (useGeneticView && geneticsLoading) ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="py-12 text-center text-sm text-destructive">
          No se pudo cargar el menú.
        </p>
      ) : useGeneticView ? (
        <div className="space-y-3">
          {farmsById[farm] && (
            <p className="text-sm text-muted-foreground">
              Genéticas de{" "}
              <span className="font-medium text-foreground">{farmsById[farm]}</span>
            </p>
          )}
          {filteredGenetics.map((g) => {
            const linked = products.find((p) => p.id === g.productId);
            return (
              <FarmGeneticCard
                key={g.id}
                genetic={g}
                farmName={farmsById[g.farmId] ?? "Farm"}
                product={linked}
              />
            );
          })}
          {filteredGenetics.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No hay genéticas en esta farm.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {filteredProducts.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {products.length === 0
                ? "Tu club aún no ha publicado productos en el menú."
                : "No hay productos para esta búsqueda."}
            </p>
          )}
        </div>
      )}

      <CartBar />
    </div>
  );
}

function Chip({
  active,
  accentColor,
  onClick,
  children,
}: {
  active: boolean;
  accentColor?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "min-h-10 shrink-0 touch-manipulation whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors active:scale-[0.98]",
        !accentColor &&
          (active
            ? "border-primary bg-primary/15 text-primary"
            : "border-border text-muted-foreground hover:text-foreground"),
      )}
      style={accentColor ? categoryChipStyle(accentColor, active) : undefined}
    >
      {children}
    </button>
  );
}
