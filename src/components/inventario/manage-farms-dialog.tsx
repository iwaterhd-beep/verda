"use client";

import * as React from "react";
import {
  Sprout,
  Loader2,
  Plus,
  Trash2,
  ChevronLeft,
  Pencil,
  Dna,
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
  createFarmAction,
  updateFarmAction,
  deleteFarmAction,
  createGeneticAction,
  updateGeneticAction,
  deleteGeneticAction,
} from "@/app/(dashboard)/inventario/farm-actions";
import {
  fetchClubFarms,
  fetchFarmGenetics,
} from "@/lib/data/product-farms";
import { uploadCatalogVideosParallel } from "@/lib/data/product-media";
import { geneticsOptions, originOptions } from "@/lib/product-strain";
import type { FarmGenetic, ProductFarm } from "@/types";
import type { ProductGenetics, ProductOrigin } from "@/lib/product-strain";

type View =
  | { mode: "list" }
  | { mode: "farm"; farm: ProductFarm }
  | { mode: "genetic"; farm: ProductFarm; genetic?: FarmGenetic };

export function ManageFarmsDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<View>({ mode: "list" });
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const [farmName, setFarmName] = React.useState("");
  const [farmDescription, setFarmDescription] = React.useState("");
  const [farmPhotos, setFarmPhotos] = React.useState<string[]>([]);
  const [farmVideos, setFarmVideos] = React.useState<string[]>([]);
  const [pendingFarmVideos, setPendingFarmVideos] = React.useState<File[]>([]);

  const [geneticName, setGeneticName] = React.useState("");
  const [geneticDescription, setGeneticDescription] = React.useState("");
  const [geneticPhotos, setGeneticPhotos] = React.useState<string[]>([]);
  const [geneticVideos, setGeneticVideos] = React.useState<string[]>([]);
  const [pendingGeneticVideos, setPendingGeneticVideos] = React.useState<File[]>([]);
  const [geneticPrice, setGeneticPrice] = React.useState("0");
  const [geneticComparePrice, setGeneticComparePrice] = React.useState("");
  const [geneticType, setGeneticType] = React.useState<ProductGenetics | "">("");
  const [geneticOrigin, setGeneticOrigin] = React.useState<ProductOrigin | "">("");
  const [geneticThc, setGeneticThc] = React.useState("");

  const { data: farms = [], isLoading } = useQuery({
    queryKey: ["club-farms"],
    queryFn: fetchClubFarms,
    enabled: open,
  });

  const activeFarmId =
    view.mode === "farm" || view.mode === "genetic" ? view.farm.id : null;

  const { data: genetics = [], isLoading: geneticsLoading } = useQuery({
    queryKey: ["farm-genetics", activeFarmId],
    queryFn: () => fetchFarmGenetics(activeFarmId!),
    enabled: open && Boolean(activeFarmId),
  });

  React.useEffect(() => {
    if (!open) {
      setView({ mode: "list" });
      resetFarmForm();
      resetGeneticForm();
    }
  }, [open]);

  function resetFarmForm(farm?: ProductFarm) {
    setFarmName(farm?.name ?? "");
    setFarmDescription(farm?.description ?? "");
    setFarmPhotos(farm?.photos ?? []);
    setFarmVideos(farm?.videoUrls ?? []);
    setPendingFarmVideos([]);
  }

  function resetGeneticForm(genetic?: FarmGenetic) {
    setGeneticName(genetic?.name ?? "");
    setGeneticDescription(genetic?.description ?? "");
    setGeneticPhotos(genetic?.photos ?? []);
    setGeneticVideos(genetic?.videoUrls ?? []);
    setPendingGeneticVideos([]);
    setGeneticPrice(String(genetic?.pricePerUnit ?? 0));
    setGeneticComparePrice(
      genetic?.compareAtPrice != null ? String(genetic.compareAtPrice) : "",
    );
    setGeneticType(genetic?.genetics ?? "");
    setGeneticOrigin(genetic?.origin ?? "");
    setGeneticThc(
      genetic?.thcPercent != null ? String(genetic.thcPercent) : "",
    );
  }

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: ["club-farms"] });
    if (activeFarmId) {
      await queryClient.invalidateQueries({
        queryKey: ["farm-genetics", activeFarmId],
      });
    }
    await queryClient.invalidateQueries({ queryKey: ["portal-farm-genetics"] });
  }

  async function handleSaveFarm(e: React.FormEvent) {
    e.preventDefault();
    if (!farmName.trim()) {
      toast.error("Indica un nombre para la farm");
      return;
    }

    setSaving(true);
    try {
      const isEditing = view.mode === "farm" && Boolean(view.farm.id);
      let videoUrls = [...farmVideos];

      if (isEditing && pendingFarmVideos.length > 0) {
        const uploaded = await uploadCatalogVideosParallel(
          `farms/${view.farm.id}`,
          pendingFarmVideos,
        );
        if (uploaded.errors.length) {
          toast.error("Algunos vídeos no se subieron", {
            description: uploaded.errors[0],
          });
        }
        videoUrls = [...videoUrls, ...uploaded.urls];
      }

      const payload = {
        name: farmName.trim(),
        description: farmDescription.trim(),
        photos: farmPhotos,
        videoUrls: isEditing ? videoUrls : [],
      };

      const res = isEditing
        ? await updateFarmAction(view.farm.id, { ...payload, videoUrls })
        : await createFarmAction(payload);

      if (res.error) {
        toast.error("No se pudo guardar", { description: res.error });
        return;
      }

      let savedFarm = res.farm!;

      if (!isEditing && pendingFarmVideos.length > 0) {
        const uploaded = await uploadCatalogVideosParallel(
          `farms/${savedFarm.id}`,
          pendingFarmVideos,
        );
        if (uploaded.errors.length) {
          toast.error("Farm creada, pero falló un vídeo", {
            description: uploaded.errors[0],
          });
        }
        if (uploaded.urls.length) {
          const upd = await updateFarmAction(savedFarm.id, {
            ...payload,
            videoUrls: uploaded.urls,
          });
          if (upd.farm) savedFarm = upd.farm;
        }
      }

      setPendingFarmVideos([]);
      setFarmVideos(savedFarm.videoUrls);
      toast.success(isEditing ? "Farm actualizada" : "Farm creada");
      await invalidate();
      setView({ mode: "farm", farm: savedFarm });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteFarm(farm: ProductFarm) {
    if (
      !window.confirm(`¿Eliminar la farm «${farm.name}» y todo su contenido?`)
    ) {
      return;
    }
    setDeletingId(farm.id);
    try {
      const res = await deleteFarmAction(farm.id);
      if (res.error) {
        toast.error("No se pudo eliminar", { description: res.error });
        return;
      }
      toast.success("Farm eliminada");
      setView({ mode: "list" });
      await invalidate();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSaveGenetic(e: React.FormEvent) {
    e.preventDefault();
    if (view.mode !== "genetic") return;
    if (!geneticName.trim()) {
      toast.error("Indica un nombre para la genética");
      return;
    }

    const price = Number(geneticPrice.replace(",", "."));
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Precio inválido");
      return;
    }

    const compareRaw = geneticComparePrice.trim().replace(",", ".");
    const compareAtPrice = compareRaw ? Number(compareRaw) : null;
    const thcRaw = geneticThc.trim().replace(",", ".");
    const thcPercent = thcRaw ? Number(thcRaw) : null;

    setSaving(true);
    try {
      const isEditing = Boolean(view.genetic?.id);
      let videoUrls = [...geneticVideos];

      if (isEditing && pendingGeneticVideos.length > 0) {
        const uploaded = await uploadCatalogVideosParallel(
          `farms/${view.farm.id}/genetics/${view.genetic!.id}`,
          pendingGeneticVideos,
        );
        if (uploaded.errors.length) {
          toast.error("Algunos vídeos no se subieron", {
            description: uploaded.errors[0],
          });
        }
        videoUrls = [...videoUrls, ...uploaded.urls];
      }

      const payload = {
        farmId: view.farm.id,
        name: geneticName.trim(),
        description: geneticDescription.trim(),
        photos: geneticPhotos,
        videoUrls: isEditing ? videoUrls : [],
        pricePerUnit: price,
        compareAtPrice:
          compareAtPrice != null && Number.isFinite(compareAtPrice)
            ? compareAtPrice
            : null,
        genetics: geneticType || null,
        origin: geneticOrigin || null,
        thcPercent:
          thcPercent != null && Number.isFinite(thcPercent) ? thcPercent : null,
      };

      const res = isEditing
        ? await updateGeneticAction(view.genetic!.id, payload)
        : await createGeneticAction(payload);

      if (res.error) {
        toast.error("No se pudo guardar", { description: res.error });
        return;
      }

      let savedGenetic = res.genetic!;

      if (!isEditing && pendingGeneticVideos.length > 0) {
        const uploaded = await uploadCatalogVideosParallel(
          `farms/${view.farm.id}/genetics/${savedGenetic.id}`,
          pendingGeneticVideos,
        );
        if (uploaded.errors.length) {
          toast.error("Genética creada, pero falló un vídeo", {
            description: uploaded.errors[0],
          });
        }
        if (uploaded.urls.length) {
          const upd = await updateGeneticAction(savedGenetic.id, {
            ...payload,
            videoUrls: uploaded.urls,
          });
          if (upd.genetic) savedGenetic = upd.genetic;
        }
      }

      setPendingGeneticVideos([]);
      setGeneticVideos(savedGenetic.videoUrls);
      toast.success(isEditing ? "Genética actualizada" : "Genética creada");
      await invalidate();
      setView({ mode: "farm", farm: view.farm });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGenetic(genetic: FarmGenetic) {
    if (!window.confirm(`¿Eliminar «${genetic.name}»?`)) return;
    setDeletingId(genetic.id);
    try {
      const res = await deleteGeneticAction(genetic.id);
      if (res.error) {
        toast.error("No se pudo eliminar", { description: res.error });
        return;
      }
      toast.success("Genética eliminada");
      await invalidate();
    } finally {
      setDeletingId(null);
    }
  }

  const title =
    view.mode === "list"
      ? "Farms"
      : view.mode === "farm"
        ? view.farm.name
        : view.genetic
          ? `Editar ${view.genetic.name}`
          : "Nueva genética";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sprout className="mr-2 h-4 w-4" />
          Farms
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
                  if (view.mode === "genetic") {
                    setView({ mode: "farm", farm: view.farm });
                    resetGeneticForm();
                  } else {
                    setView({ mode: "list" });
                    resetFarmForm();
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
                  ? "Catálogo de farms y genéticas con precio y media."
                  : view.mode === "farm"
                    ? "Genéticas de esta farm y datos del cultivador."
                    : "Precio, ficha y fotos/vídeos de la genética."}
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
            ) : farms.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aún no hay farms. Crea la primera cultivador.
              </p>
            ) : (
              <ul className="space-y-2">
                {farms.map((farm) => (
                  <li
                    key={farm.id}
                    className="flex items-center gap-2 rounded-xl border border-border/60 p-3"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => {
                        resetFarmForm(farm);
                        setView({ mode: "farm", farm });
                      }}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-lg">
                        🌱
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{farm.name}</p>
                        {farm.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {farm.description}
                          </p>
                        )}
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive"
                      disabled={deletingId === farm.id}
                      onClick={() => void handleDeleteFarm(farm)}
                    >
                      {deletingId === farm.id ? (
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
                resetFarmForm();
                setView({
                  mode: "farm",
                  farm: {
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
              Nueva farm
            </Button>
          </div>
        )}

        {view.mode === "farm" && (
          <div className="space-y-6">
            <form onSubmit={handleSaveFarm} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="farm-name">Nombre</Label>
                <Input
                  id="farm-name"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="Ej. Organic Sun Grown"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="farm-desc">Descripción</Label>
                <Textarea
                  id="farm-desc"
                  value={farmDescription}
                  onChange={(e) => setFarmDescription(e.target.value)}
                  placeholder="Historia, método de cultivo…"
                  rows={3}
                />
              </div>
              <CatalogMediaFields
                photos={farmPhotos}
                videoUrls={farmVideos}
                onPhotosChange={setFarmPhotos}
                onVideoUrlsChange={setFarmVideos}
                storagePrefix={`farms/${view.farm.id || "draft"}`}
                deferUpload={!view.farm.id}
                onPendingVideosChange={setPendingFarmVideos}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {view.farm.id ? "Guardar farm" : "Crear farm"}
                </Button>
              </DialogFooter>
            </form>

            {view.farm.id && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Dna className="h-4 w-4" />
                    Genéticas
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      resetGeneticForm();
                      setView({ mode: "genetic", farm: view.farm });
                    }}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Añadir
                  </Button>
                </div>

                {geneticsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : genetics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin genéticas. Añade variedades con su precio.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {genetics.map((g) => (
                      <li
                        key={g.id}
                        className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/10 p-3"
                      >
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => {
                            resetGeneticForm(g);
                            setView({
                              mode: "genetic",
                              farm: view.farm,
                              genetic: g,
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
                            resetGeneticForm(g);
                            setView({
                              mode: "genetic",
                              farm: view.farm,
                              genetic: g,
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
                          onClick={() => void handleDeleteGenetic(g)}
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

        {view.mode === "genetic" && (
          <form onSubmit={handleSaveGenetic} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="genetic-name">Nombre</Label>
              <Input
                id="genetic-name"
                value={geneticName}
                onChange={(e) => setGeneticName(e.target.value)}
                placeholder="Ej. Critical Kush"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="genetic-desc">Descripción (opcional)</Label>
              <Textarea
                id="genetic-desc"
                value={geneticDescription}
                onChange={(e) => setGeneticDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="genetic-price">Precio (Crd/g)</Label>
                <Input
                  id="genetic-price"
                  inputMode="decimal"
                  value={geneticPrice}
                  onChange={(e) => setGeneticPrice(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="genetic-compare">Precio anterior</Label>
                <Input
                  id="genetic-compare"
                  inputMode="decimal"
                  placeholder="Opcional"
                  value={geneticComparePrice}
                  onChange={(e) => setGeneticComparePrice(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select
                  value={geneticType || "none"}
                  onValueChange={(v) =>
                    setGeneticType(v === "none" ? "" : (v as ProductGenetics))
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
                  value={geneticOrigin || "none"}
                  onValueChange={(v) =>
                    setGeneticOrigin(v === "none" ? "" : (v as ProductOrigin))
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
              <Label htmlFor="genetic-thc">THC % (opcional)</Label>
              <Input
                id="genetic-thc"
                inputMode="decimal"
                value={geneticThc}
                onChange={(e) => setGeneticThc(e.target.value)}
              />
            </div>
            <CatalogMediaFields
              photos={geneticPhotos}
              videoUrls={geneticVideos}
              onPhotosChange={setGeneticPhotos}
              onVideoUrlsChange={setGeneticVideos}
              storagePrefix={`farms/${view.farm.id}/genetics/${view.genetic?.id || "draft"}`}
              deferUpload={!view.genetic?.id}
              onPendingVideosChange={setPendingGeneticVideos}
            />
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {view.genetic ? "Guardar genética" : "Crear genética"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
