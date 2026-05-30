"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/portal/product-card";
import { CartBar } from "@/components/portal/cart-bar";
import { products } from "@/lib/mock-data";
import { categoryMeta, categoryOrder } from "@/lib/product-meta";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

export default function MenuPage() {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<Product["category"] | "ALL">(
    "ALL",
  );

  const availableCategories = categoryOrder.filter((c) =>
    products.some((p) => p.category === c),
  );

  const filtered = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    const matchesCat = category === "ALL" || p.category === category;
    return matchesQuery && matchesCat;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Menú</h1>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto…"
          className="pl-9"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-thin">
        <Chip active={category === "ALL"} onClick={() => setCategory("ALL")}>
          Todo
        </Chip>
        {availableCategories.map((c) => (
          <Chip
            key={c}
            active={category === c}
            onClick={() => setCategory(c)}
          >
            {categoryMeta[c].emoji} {categoryMeta[c].label}
          </Chip>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No hay productos para esta búsqueda.
          </p>
        )}
      </div>

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
        "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
