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
  updateCategoryColorAction,
} from "@/app/(dashboard)/inventario/category-actions";
import {
  categorySurfaceStyle,
  getCategoryDisplay,
  isCannabisCategory,
  resolveCategoryColor,
} from "@/lib/product-categories";

const DEFAULT_NEW_COLOR = "#14b8a6";

export function ManageCategoriesDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [emoji, setEmoji] = React.useState("");
  const [color, setColor] = React.useState(DEFAULT_NEW_COLOR);
  const [isCannabis, setIsCannabis] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [savingColorId, setSavingColorId] = React.useState<string | null>(null);

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
        color,
      });
      if (res.error) {
        toast.error("No se pudo crear la categoría", { description: res.error });
        return;
      }
      toast.success("Categoría creada", { description: res.category?.label });
      setLabel("");
      setEmoji("");
      setColor(DEFAULT_NEW_COLOR);
      setIsCannabis(false);
      await queryClient.invalidateQueries({ queryKey: ["club-categories"] });
    } finally {
      setCreating(false);
    }
  }

  async function handleColorChange(categoryId: string, nextColor: string) {
    setSavingColorId(categoryId);
    try {
      const res = await updateCategoryColorAction(categoryId, nextColor);
      if (res.error) {
        toast.error("No se pudo guardar el color", { description: res.error });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["club-categories"] });
    } finally {
      setSavingColorId(null);
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
            Nombre, emoji y color de cada categoría en el menú e inventario.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            categories.map((cat) => {
              const display = getCategoryDisplay(cat.id, categories);
              return (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg"
                    style={categorySurfaceStyle(display.color)}
                  >
                    {cat.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{cat.label}</p>
                    {cat.isCannabis && (
                      <p className="text-[11px] text-muted-foreground">
                        Ficha cannabis
                      </p>
                    )}
                  </div>
                  <label className="relative shrink-0">
                    <span className="sr-only">Color de {cat.label}</span>
                    <input
                      type="color"
                      value={resolveCategoryColor(cat)}
                      disabled={savingColorId === cat.id}
                      onChange={(e) =>
                        void handleColorChange(cat.id, e.target.value)
                      }
                      className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-transparent p-0.5 disabled:opacity-50"
                    />
                  </label>
                  {isCannabisCategory(cat.id, categories) && (
                    <Badge variant="outline" className="hidden shrink-0 md:inline-flex">
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
              );
            })
          )}
        </div>

        <form onSubmit={handleCreate} className="space-y-3 border-t border-border pt-4">
          <p className="text-sm font-medium">Nueva categoría</p>
          <div className="grid grid-cols-[1fr_4.5rem_3rem] gap-2">
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
            <div className="grid gap-2">
              <Label htmlFor="catColor">Color</Label>
              <input
                id="catColor"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-md border border-input bg-transparent p-1"
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
