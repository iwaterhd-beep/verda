"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchPackComponentProducts } from "@/lib/data/products";
import { useQuery } from "@tanstack/react-query";
import type { PackItem, Product } from "@/types";

export type PackItemDraft = {
  productId: string;
  qty: number;
  unit: "g" | "ud";
};

interface ProductPackFieldsProps {
  items: PackItemDraft[];
  onChange: (items: PackItemDraft[]) => void;
  excludeProductId?: string;
  enabled?: boolean;
}

export function ProductPackFields({
  items,
  onChange,
  excludeProductId,
  enabled = true,
}: ProductPackFieldsProps) {
  const { data: products = [] } = useQuery({
    queryKey: ["pack-component-products"],
    queryFn: fetchPackComponentProducts,
    enabled,
  });

  const options = products.filter((p) => p.id !== excludeProductId);

  function addRow() {
    const first = options[0];
    if (!first) return;
    onChange([
      ...items,
      {
        productId: first.id,
        qty: first.unit === "ud" ? 1 : 10,
        unit: first.unit === "ud" ? "ud" : "g",
      },
    ]);
  }

  function updateRow(index: number, patch: Partial<PackItemDraft>) {
    onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function onProductChange(index: number, productId: string) {
    const product = options.find((p) => p.id === productId);
    updateRow(index, {
      productId,
      unit: product?.unit === "ud" ? "ud" : "g",
      qty: product?.unit === "ud" ? 1 : items[index]?.qty || 10,
    });
  }

  React.useEffect(() => {
    if (!enabled || items.length || !options.length) return;
    addRow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, options.length]);

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/20 p-3">
      <div>
        <Label>Contenido del pack</Label>
        <p className="text-xs text-muted-foreground">
          Añade uno o varios productos con sus cantidades. El precio del pack es fijo.
        </p>
      </div>

      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Crea al menos un producto normal antes de definir un pack.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((row, index) => (
              <div
                key={`${row.productId}-${index}`}
                className="grid grid-cols-[1fr_88px_72px_auto] items-end gap-2"
              >
                <div className="grid gap-1">
                  {index === 0 && (
                    <span className="text-xs text-muted-foreground">Producto</span>
                  )}
                  <Select
                    value={row.productId}
                    onValueChange={(v) => onProductChange(index, v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((p: Product) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  {index === 0 && (
                    <span className="text-xs text-muted-foreground">Cantidad</span>
                  )}
                  <Input
                    type="number"
                    min={row.unit === "ud" ? 1 : 0.01}
                    step={row.unit === "ud" ? 1 : 0.01}
                    className="h-9"
                    value={row.qty}
                    onChange={(e) =>
                      updateRow(index, { qty: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="grid gap-1">
                  {index === 0 && (
                    <span className="text-xs text-muted-foreground">Unidad</span>
                  )}
                  <Select
                    value={row.unit}
                    onValueChange={(v) =>
                      updateRow(index, { unit: v as PackItem["unit"] })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="ud">ud</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-destructive"
                  disabled={items.length <= 1}
                  onClick={() => removeRow(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
          ))}
        </div>
      )}

      {options.length > 0 && (
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4" /> Añadir producto al pack
        </Button>
      )}

      {items.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Ejemplo: 50g de una flor a precio fijo, o varios productos en un solo pack.
        </p>
      )}
    </div>
  );
}

export function packItemsFromProduct(product?: Product): PackItemDraft[] {
  if (!product?.packItems?.length) return [];
  return product.packItems.map((item) => ({
    productId: item.productId,
    qty: item.qty,
    unit: item.unit,
  }));
}
