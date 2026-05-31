"use client";

import * as React from "react";
import {
  FlaskConical,
  Loader2,
  Plus,
  Trash2,
  ChevronLeft,
  Pencil,
  Package,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CatalogMediaFields } from "@/components/inventario/catalog-media-fields";
import {
  createJarAction,
  updateJarAction,
  deleteJarAction,
  createJarItemAction,
  updateJarItemAction,
  deleteJarItemAction,
} from "@/app/(dashboard)/inventario/jar-actions";
import {
  fetchClubJars,
  fetchJarItems,
} from "@/lib/data/product-jars";
import { uploadCatalogVideosParallel } from "@/lib/data/product-media";
import { geneticsOptions, originOptions } from "@/lib/product-strain";
import type { JarItem, ProductJar } from "@/types";
import type { ProductGenetics, ProductOrigin } from "@/lib/product-strain";

type View =
  | { mode: "list" }
  | { mode: "jar"; jar: ProductJar }
  | { mode: "item"; jar: ProductJar; item?: JarItem };

export function ManageJarsDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<View>({ mode: "list" });
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const [jarName, setJarName] = React.useState("");
  const [jarDescription, setJarDescription] = React.useState("");
  const [jarPhotos, setJarPhotos] = React.useState<string[]>([]);
  const [jarVideos, setJarVideos] = React.useState<string[]>([]);
  const [pendingJarVideos, setPendingJarVideos] = React.useState<File[]>([]);

  const [itemName, setItemName] = React.useState("");
  const [itemDescription, setItemDescription] = React.useState("");
  const [itemPhotos, setItemPhotos] = React.useState<string[]>([]);
  const [itemVideos, setItemVideos] = React.useState<string[]>([]);
  const [pendingItemVideos, setPendingItemVideos] = React.useState<File[]>([]);
  const [itemPrice, setItemPrice] = React.useState("0");
  const [itemComparePrice, setItemComparePrice] = React.useState("");
  const [itemType, setItemType] = React.useState<ProductGenetics | "">("");
  const [itemOrigin, setItemOrigin] = React.useState<ProductOrigin | "">("");
  const [itemThc, setItemThc] = React.useState("");

  const { data: jars = [], isLoading } = useQuery({
    queryKey: ["club-jars"],
    queryFn: fetchClubJars,
    enabled: open,
  });

  const activeJarId =
    view.mode === "jar" || view.mode === "item" ? view.jar.id : null;

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["jar-items", activeJarId],
    queryFn: () => fetchJarItems(activeJarId!),
    enabled: open && Boolean(activeJarId),
  });

  React.useEffect(() => {
    if (!open) {
      setView({ mode: "list" });
      resetJarForm();
      resetItemForm();
    }
  }, [open]);

  function resetJarForm(jar?: ProductJar) {
    setJarName(jar?.name ?? "");
    setJarDescription(jar?.description ?? "");
    setJarPhotos(jar?.photos ?? []);
    setJarVideos(jar?.videoUrls ?? []);
    setPendingJarVideos([]);
  }

  function resetItemForm(item?: JarItem) {
    setItemName(item?.name ?? "");
    setItemDescription(item?.description ?? "");
    setItemPhotos(item?.photos ?? []);
    setItemVideos(item?.videoUrls ?? []);
    setPendingItemVideos([]);
    setItemPrice(String(item?.pricePerUnit ?? 0));
    setItemComparePrice(
      item?.compareAtPrice != null ? String(item.compareAtPrice) : "",
    );
    setItemType(item?.genetics ?? "");
    setItemOrigin(item?.origin ?? "");
    setItemThc(item?.thcPercent != null ? String(item.thcPercent) : "");
  }

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: ["club-jars"] });
    if (activeJarId) {
      await queryClient.invalidateQueries({
        queryKey: ["jar-items", activeJarId],
      });
    }
    await queryClient.invalidateQueries({ queryKey: ["portal-jar-items"] });
  }

  async function handleSaveJar(e: React.FormEvent) {
    e.preventDefault();
    if (!jarName.trim()) {
      toast.error("Indica un nombre para el jar");
      return;
    }

    setSaving(true);
    try {
      const isEditing = view.mode === "jar" && Boolean(view.jar.id);
      let videoUrls = [...jarVideos];

      if (isEditing && pendingJarVideos.length > 0) {
        const uploaded = await uploadCatalogVideosParallel(
          `jars/${view.jar.id}`,
          pendingJarVideos,
        );
        if (uploaded.errors.length) {
          toast.error("Algunos vídeos no se subieron", {
            description: uploaded.errors[0],
          });
        }
        videoUrls = [...videoUrls, ...uploaded.urls];
      }

      const payload = {
        name: jarName.trim(),
        description: jarDescription.trim(),
        photos: jarPhotos,
        videoUrls: isEditing ? videoUrls : [],
      };

      const res = isEditing
        ? await updateJarAction(view.jar.id, { ...payload, videoUrls })
        : await createJarAction(payload);

      if (res.error) {
        toast.error("No se pudo guardar", { description: res.error });
        return;
      }

      let savedJar = res.jar!;

      if (!isEditing && pendingJarVideos.length > 0) {
        const uploaded = await uploadCatalogVideosParallel(
          `jars/${savedJar.id}`,
          pendingJarVideos,
        );
        if (uploaded.errors.length) {
          toast.error("Jar creado, pero falló un vídeo", {
            description: uploaded.errors[0],
          });
        }
        if (uploaded.urls.length) {
          const upd = await updateJarAction(savedJar.id, {
            ...payload,
            videoUrls: uploaded.urls,
          });
          if (upd.jar) savedJar = upd.jar;
        }
      }

      setPendingJarVideos([]);
      setJarVideos(savedJar.videoUrls);
      toast.success(isEditing ? "Jar actualizado" : "Jar creado");
      await invalidate();
      setView({ mode: "jar", jar: savedJar });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteJar(jar: ProductJar) {
    if (
      !window.confirm(`¿Eliminar el jar «${jar.name}» y todo su contenido?`)
    ) {
      return;
    }
    setDeletingId(jar.id);
    try {
      const res = await deleteJarAction(jar.id);
      if (res.error) {
        toast.error("No se pudo eliminar", { description: res.error });
        return;
      }
      toast.success("Jar eliminado");
      setView({ mode: "list" });
      await invalidate();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (view.mode !== "item") return;
    if (!itemName.trim()) {
      toast.error("Indica un nombre para la ítem");
      return;
    }

    const price = Number(itemPrice.replace(",", "."));
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Precio inválido");
      return;
    }

    const compareRaw = itemComparePrice.trim().replace(",", ".");
    const compareAtPrice = compareRaw ? Number(compareRaw) : null;
    const thcRaw = itemThc.trim().replace(",", ".");
    const thcPercent = thcRaw ? Number(thcRaw) : null;

    setSaving(true);
    try {
      const isEditing = Boolean(view.item?.id);
      let videoUrls = [...itemVideos];

      if (isEditing && pendingItemVideos.length > 0) {
        const uploaded = await uploadCatalogVideosParallel(
          `jars/${view.jar.id}/items/${view.item!.id}`,
          pendingItemVideos,
        );
        if (uploaded.errors.length) {
          toast.error("Algunos vídeos no se subieron", {
            description: uploaded.errors[0],
          });
        }
        videoUrls = [...videoUrls, ...uploaded.urls];
      }

      const payload = {
        jarId: view.jar.id,
        name: itemName.trim(),
        description: itemDescription.trim(),
        photos: itemPhotos,
        videoUrls: isEditing ? videoUrls : [],
        pricePerUnit: price,
        compareAtPrice:
          compareAtPrice != null && Number.isFinite(compareAtPrice)
            ? compareAtPrice
            : null,
        genetics: itemType || null,
        origin: itemOrigin || null,
        thcPercent:
          thcPercent != null && Number.isFinite(thcPercent) ? thcPercent : null,
      };

      const res = isEditing
        ? await updateJarItemAction(view.item!.id, payload)
        : await createJarItemAction(payload);

      if (res.error) {
        toast.error("No se pudo guardar", { description: res.error });
        return;
      }

      let savedItem = res.item!;

      if (!isEditing && pendingItemVideos.length > 0) {
        const uploaded = await uploadCatalogVideosParallel(
          `jars/${view.jar.id}/items/${savedItem.id}`,
          pendingItemVideos,
        );
        if (uploaded.errors.length) {
          toast.error("Ítem creada, pero falló un vídeo", {
            description: uploaded.errors[0],
          });
        }
        if (uploaded.urls.length) {
          const upd = await updateJarItemAction(savedItem.id, {
            ...payload,
            videoUrls: uploaded.urls,
          });
          if (upd.item) savedItem = upd.item;
        }
      }

      setPendingItemVideos([]);
      setItemVideos(savedItem.videoUrls);
      toast.success(isEditing ? "Ítem actualizada" : "Ítem creada");
      await invalidate();
      setView({ mode: "jar", jar: view.jar });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(item: JarItem) {
    if (!window.confirm(`¿Eliminar «${item.name}»?`)) return;
    setDeletingId(item.id);
    try {
      const res = await deleteJarItemAction(item.id);
      if (res.error) {
        toast.error("No se pudo eliminar", { description: res.error });
        return;
      }
      toast.success("Ítem eliminada");
      await invalidate();
    } finally {
      setDeletingId(null);
    }
  }

  const title =
    view.mode === "list"
      ? "Jars"
      : view.mode === "jar"
        ? view.jar.name
        : view.item
          ? `Editar ${view.item.name}`
          : "Nueva ítem";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FlaskConical className="mr-2 h-4 w-4" />
          Jars
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {view.mode !== "list" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  if (view.mode === "item") {
                    setView({ mode: "jar", jar: view.jar });
                    resetItemForm();
                  } else {
                    setView({ mode: "list" });
                    resetJarForm();
                  }
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                {view.mode === "list"
                  ? "Catálogo de jars e ítems con precio y media."
                  : view.mode === "jar"
                    ? "Ítems de esta jar y datos del catálogo Jars."
                    : "Precio, ficha y fotos/vídeos de la ítem."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {view.mode === "list" && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : jars.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aún no hay jars. Crea la primera catálogo Jars.
              </p>
            ) : (
              <ul className="space-y-2">
                {jars.map((jar) => (
                  <li
                    key={jar.id}
                    className="flex items-center gap-2 rounded-xl border border-border/60 p-3"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => {
                        resetJarForm(jar);
                        setView({ mode: "jar", jar });
                      }}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-lg">
                        🫙
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{jar.name}</p>
                        {jar.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {jar.description}
                          </p>
                        )}
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive"
                      disabled={deletingId === jar.id}
                      onClick={() => void handleDeleteJar(jar)}
                    >
                      {deletingId === jar.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <Button
              type="button"
              className="w-full"
              onClick={() => {
                resetJarForm();
                setView({
                  mode: "jar",
                  jar: {
                    id: "",
                    name: "",
                    photos: [],
                    videoUrls: [],
                    sortOrder: 0,
                  },
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo jar
            </Button>
          </div>
        )}

        {view.mode === "jar" && (
          <div className="space-y-6">
            <form onSubmit={handleSaveJar} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="jar-name">Nombre</Label>
                <Input
                  id="jar-name"
                  value={jarName}
                  onChange={(e) => setJarName(e.target.value)}
                  placeholder="Ej. Organic Sun Grown"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jar-desc">Descripción</Label>
                <Textarea
                  id="jar-desc"
                  value={jarDescription}
                  onChange={(e) => setJarDescription(e.target.value)}
                  placeholder="Historia, método de cultivo…"
                  rows={3}
                />
              </div>
              <CatalogMediaFields
                photos={jarPhotos}
                videoUrls={jarVideos}
                onPhotosChange={setJarPhotos}
                onVideoUrlsChange={setJarVideos}
                storagePrefix={`jars/${view.jar.id || "draft"}`}
                deferUpload={!view.jar.id}
                onPendingVideosChange={setPendingJarVideos}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {view.jar.id ? "Guardar jar" : "Crear jar"}
                </Button>
              </DialogFooter>
            </form>

            {view.jar.id && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Ítems
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      resetItemForm();
                      setView({ mode: "item", jar: view.jar });
                    }}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Añadir
                  </Button>
                </div>

                {itemsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin ítems. Añade variedades con su precio.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((g) => (
                      <li
                        key={g.id}
                        className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/10 p-3"
                      >
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => {
                            resetItemForm(g);
                            setView({
                              mode: "item",
                              jar: view.jar,
                              item: g,
                            });
                          }}
                        >
                          <p className="font-medium truncate">{g.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {g.pricePerUnit.toFixed(2)} Crd/g
                            {g.genetics && (
                              <Badge variant="outline" className="ml-2 h-5 text-[10px]">
                                {g.genetics}
                              </Badge>
                            )}
                          </p>
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            resetItemForm(g);
                            setView({
                              mode: "item",
                              jar: view.jar,
                              item: g,
                            });
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          disabled={deletingId === g.id}
                          onClick={() => void handleDeleteItem(g)}
                        >
                          {deletingId === g.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {view.mode === "item" && (
          <form onSubmit={handleSaveItem} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="item-name">Nombre</Label>
              <Input
                id="item-name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ej. Critical Kush"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-desc">Descripción (opcional)</Label>
              <Textarea
                id="item-desc"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="item-price">Precio (Crd/g)</Label>
                <Input
                  id="item-price"
                  inputMode="decimal"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item-compare">Precio anterior</Label>
                <Input
                  id="item-compare"
                  inputMode="decimal"
                  placeholder="Opcional"
                  value={itemComparePrice}
                  onChange={(e) => setItemComparePrice(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select
                  value={itemType || "none"}
                  onValueChange={(v) =>
                    setItemType(v === "none" ? "" : (v as ProductGenetics))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
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
                  value={itemOrigin || "none"}
                  onValueChange={(v) =>
                    setItemOrigin(v === "none" ? "" : (v as ProductOrigin))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
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
              <Label htmlFor="item-thc">THC % (opcional)</Label>
              <Input
                id="item-thc"
                inputMode="decimal"
                value={itemThc}
                onChange={(e) => setItemThc(e.target.value)}
              />
            </div>
            <CatalogMediaFields
              photos={itemPhotos}
              videoUrls={itemVideos}
              onPhotosChange={setItemPhotos}
              onVideoUrlsChange={setItemVideos}
              storagePrefix={`jars/${view.jar.id}/items/${view.item?.id || "draft"}`}
              deferUpload={!view.item?.id}
              onPendingVideosChange={setPendingItemVideos}
            />
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {view.item ? "Guardar ítem" : "Crear ítem"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
