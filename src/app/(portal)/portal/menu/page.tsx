"use client";

import * as React from "react";
import { Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/portal/product-card";
import { CartBar } from "@/components/portal/cart-bar";
import { fetchClubProducts } from "@/lib/data/products";
import { fetchClubCategories } from "@/lib/data/product-categories";
import { getCategoryDisplay } from "@/lib/product-meta";
import { useCart } from "@/store/use-cart";
import { cn } from "@/lib/utils";

export default function MenuPage() {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("ALL");
  const cartCount = useCart((s) => s.count());

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["portal-products"],
    queryFn: fetchClubProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["club-categories"],
    queryFn: fetchClubCategories,
  });

  const availableCategories = categories.filter((c) =>
    products.some((p) => p.category === c.id),
  );

  const filtered = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    const matchesCat = category === "ALL" || p.category === category;
    return matchesQuery && matchesCat;
  });

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
              onClick={() => setCategory(c.id)}
            >
              {display.emoji} {display.label}
            </Chip>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="py-12 text-center text-sm text-destructive">
          No se pudo cargar el menú.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {filtered.length === 0 && (
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
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "min-h-10 shrink-0 touch-manipulation whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors active:scale-[0.98]",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
