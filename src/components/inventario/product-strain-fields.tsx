"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  geneticsOptions,
  originOptions,
  type ProductGenetics,
  type ProductOrigin,
} from "@/lib/product-strain";
import type { Product } from "@/types";

interface ProductStrainFieldsProps {
  product?: Product;
  genetics: ProductGenetics | "";
  origin: ProductOrigin | "";
  onGeneticsChange: (v: ProductGenetics | "") => void;
  onOriginChange: (v: ProductOrigin | "") => void;
}

export function ProductStrainFields({
  product,
  genetics,
  origin,
  onGeneticsChange,
  onOriginChange,
}: ProductStrainFieldsProps) {
  return (
    <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <p className="text-sm font-medium">Ficha de flor / extracto / hash</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="grower">Granja</Label>
          <Input
            id="grower"
            name="grower"
            placeholder="Ej. Green Valley"
            defaultValue={product?.grower ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="extractor">Extractor</Label>
          <Input
            id="extractor"
            name="extractor"
            placeholder="Ej. Ice Water, BHO…"
            defaultValue={product?.extractor ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="thcPercent">THC %</Label>
          <Input
            id="thcPercent"
            name="thcPercent"
            type="number"
            min={0}
            max={100}
            step="0.1"
            placeholder="22"
            defaultValue={
              product?.thcPercent != null ? String(product.thcPercent) : ""
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>Genética</Label>
          <Select
            value={genetics || "none"}
            onValueChange={(v) =>
              onGeneticsChange(v === "none" ? "" : (v as ProductGenetics))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {geneticsOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Origen</Label>
          <Select
            value={origin || "none"}
            onValueChange={(v) =>
              onOriginChange(v === "none" ? "" : (v as ProductOrigin))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="País" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {originOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Notas de sabor, efecto, cultivo…"
          defaultValue={product?.description ?? ""}
          className={cn(
            "flex w-full rounded-xl border border-input bg-secondary/40 px-3.5 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
          )}
        />
      </div>
    </div>
  );
}
