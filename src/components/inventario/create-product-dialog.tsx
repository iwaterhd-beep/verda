"use client";

import * as React from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { createProductAction } from "@/app/(dashboard)/inventario/actions";
import type { Product } from "@/types";

const categories: { value: Product["category"]; label: string }[] = [
  { value: "FLOR", label: "Flor" },
  { value: "EXTRACTO", label: "Extracto" },
  { value: "COMESTIBLE", label: "Comestible" },
  { value: "MERCH", label: "Merch" },
  { value: "OTRO", label: "Otro" },
];

export function CreateProductDialog() {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [category, setCategory] = React.useState<Product["category"]>("FLOR");
  const [unit, setUnit] = React.useState<Product["unit"]>("g");
  const queryClient = useQueryClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    if (!name) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setLoading(true);
    try {
      const res = await createProductAction({
        name,
        category,
        sku: String(form.get("sku") || ""),
        stock: Number(form.get("stock") || 0),
        unit,
        lowStockThreshold: Number(form.get("lowStockThreshold") || 10),
        pricePerUnit: Number(form.get("pricePerUnit") || 0),
        batch: String(form.get("batch") || ""),
        expiresAt: String(form.get("expiresAt") || "") || null,
      });

      if (res.error) {
        toast.error("No se pudo crear el producto", { description: res.error });
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["club-products"] });
      toast.success("Producto creado", { description: name });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Nuevo producto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo producto</DialogTitle>
          <DialogDescription>
            Añade una referencia al inventario de tu club.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" placeholder="Ej. OG Kush" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as Product["category"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Unidad</Label>
              <Select
                value={unit}
                onValueChange={(v) => setUnit(v as Product["unit"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">Gramos (g)</SelectItem>
                  <SelectItem value="ud">Unidades (ud)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock inicial</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min={0}
                step="0.01"
                defaultValue={0}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pricePerUnit">Precio / unidad (€)</Label>
              <Input
                id="pricePerUnit"
                name="pricePerUnit"
                type="number"
                min={0}
                step="0.01"
                defaultValue={0}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="lowStockThreshold">Alerta stock bajo</Label>
              <Input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                min={0}
                step="0.01"
                defaultValue={10}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU (opcional)</Label>
              <Input id="sku" name="sku" placeholder="FL-OGK" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="batch">Lote (opcional)</Label>
              <Input id="batch" name="batch" placeholder="L-2605" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiresAt">Caducidad (opcional)</Label>
              <Input id="expiresAt" name="expiresAt" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear producto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
