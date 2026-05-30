"use client";

import * as React from "react";
import { Tags, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { fetchClubCategories } from "@/lib/data/product-categories";
import {
  createCategoryAction,
  deleteCategoryAction,
} from "@/app/(dashboard)/inventario/category-actions";
import { isCannabisCategory } from "@/lib/product-categories";

export function ManageCategoriesDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [emoji, setEmoji] = React.useState("");
  const [isCannabis, setIsCannabis] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["club-categories"],
    queryFn: fetchClubCategories,
    enabled: open,
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Indica un nombre para la categoría");
      return;
    }

    setCreating(true);
    try {
      const res = await createCategoryAction({
        label: label.trim(),
        emoji: emoji.trim() || undefined,
        isCannabis,
      });
      if (res.error) {
        toast.error("No se pudo crear la categoría", { description: res.error });
        return;
      }
      toast.success("Categoría creada", { description: res.category?.label });
      setLabel("");
      setEmoji("");
      setIsCannabis(false);
      await queryClient.invalidateQueries({ queryKey: ["club-categories"] });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (
      !window.confirm(
        `¿Eliminar la categoría «${name}»? Solo es posible si no tiene productos.`,
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await deleteCategoryAction(id);
      if (res.error) {
        toast.error("No se pudo eliminar", { description: res.error });
        return;
      }
      toast.success("Categoría eliminada");
      await queryClient.invalidateQueries({ queryKey: ["club-categories"] });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Tags className="h-4 w-4" /> Categorías
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Categorías de producto</DialogTitle>
          <DialogDescription>
            Crea o elimina categorías del menú e inventario de tu club.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2"
              >
                <span className="text-lg">{cat.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{cat.label}</p>
                  {cat.isCannabis && (
                    <p className="text-[11px] text-muted-foreground">
                      Ficha cannabis
                    </p>
                  )}
                </div>
                {isCannabisCategory(cat.id, categories) && (
                  <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
                    THC
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  disabled={deletingId === cat.id}
                  onClick={() => handleDelete(cat.id, cat.label)}
                >
                  {deletingId === cat.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleCreate} className="space-y-3 border-t border-border pt-4">
          <p className="text-sm font-medium">Nueva categoría</p>
          <div className="grid grid-cols-[1fr_4.5rem] gap-2">
            <div className="grid gap-2">
              <Label htmlFor="catLabel">Nombre</Label>
              <Input
                id="catLabel"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ej. Pre-rolls"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="catEmoji">Emoji</Label>
              <Input
                id="catEmoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="✨"
                className="text-center text-lg"
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isCannabis}
              onChange={(e) => setIsCannabis(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Incluir ficha cannabis (THC, genética, origen…)
          </label>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="submit" disabled={creating}>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Crear categoría
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
