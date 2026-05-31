"use client";

import * as React from "react";
import { Plus, Loader2, Pencil, Trash2, ImagePlus, Video, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoUpload } from "@/components/applications/photo-upload";
import {
  createProductAction,
  updateProductAction,
} from "@/app/(dashboard)/inventario/actions";
import {
  uploadProductVideoClient,
  uploadProductVideosParallel,
  removeStorageFileClient,
  syncProductMediaClient,
  productMediaLike,
  productVideoUrls,
} from "@/lib/data/product-media";
import {
  MAX_PRODUCT_PHOTOS,
  MAX_PRODUCT_VIDEOS,
  maxVideoSizeLabel,
} from "@/lib/product-media-limits";
import { formatFileSize } from "@/lib/utils";
import { ProductStrainFields } from "@/components/inventario/product-strain-fields";
import { ProductGeneticLinkFields } from "@/components/inventario/product-genetic-link-fields";
import { ProductJarLinkFields } from "@/components/inventario/product-jar-link-fields";
import { isCannabisProduct } from "@/lib/product-strain";
import { productCategoriesFromList, unitMeta, unitOptions } from "@/lib/product-meta";
import {
  ProductPackFields,
  packItemsFromProduct,
  type PackItemDraft,
} from "@/components/inventario/product-pack-fields";
import { fetchClubCategories } from "@/lib/data/product-categories";
import {
  fetchClubFarms,
  fetchFarmGenetics,
} from "@/lib/data/product-farms";
import {
  fetchClubJars,
  fetchJarItems,
} from "@/lib/data/product-jars";
import { resolveProductMedia } from "@/lib/catalog-media";
import type { ProductGenetics, ProductOrigin } from "@/lib/product-strain";
import type { FarmGenetic, JarItem, Product, ProductFarm, ProductJar } from "@/types";

const MAX_PHOTOS = MAX_PRODUCT_PHOTOS;

interface ProductFormDialogProps {
  mode: "create" | "edit";
  product?: Product;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ProductFormDialog({
  mode,
  product,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: ProductFormDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState(product?.name ?? "");
  const nameRef = React.useRef<HTMLInputElement>(null);
  const priceInputRef = React.useRef<HTMLInputElement>(null);
  const [category, setCategory] = React.useState<Product["category"]>(
    product?.category ?? "FLOR",
  );
  const [unit, setUnit] = React.useState<Product["unit"]>(product?.unit ?? "g");
  const [isPack, setIsPack] = React.useState(product?.isPack ?? false);
  const [hiddenFromMembers, setHiddenFromMembers] = React.useState(
    product?.hiddenFromMembers ?? false,
  );
  const [packItems, setPackItems] = React.useState<PackItemDraft[]>(() =>
    packItemsFromProduct(product),
  );
  const unitInfo = unitMeta(isPack ? "pack" : unit);
  const [genetics, setGenetics] = React.useState<ProductGenetics | "">(
    product?.genetics ?? "",
  );
  const [farmId, setFarmId] = React.useState(product?.farmId ?? "");
  const [geneticId, setGeneticId] = React.useState(product?.geneticId ?? "");
  const [jarId, setJarId] = React.useState(product?.jarId ?? "");
  const [jarItemId, setJarItemId] = React.useState(product?.jarItemId ?? "");
  const [origin, setOrigin] = React.useState<ProductOrigin | "">(
    product?.origin ?? "",
  );
  const [photos, setPhotos] = React.useState<string[]>(product?.photos ?? []);
  const [videoUrls, setVideoUrls] = React.useState<string[]>(() =>
    product ? productVideoUrls(product) : [],
  );
  const [pendingVideos, setPendingVideos] = React.useState<
    { file: File; preview: string; uploading?: boolean }[]
  >([]);
  const [uploadingVideoCount, setUploadingVideoCount] = React.useState(0);
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery({
    queryKey: ["club-categories"],
    queryFn: fetchClubCategories,
    enabled: open,
  });
  const { data: farms = [] } = useQuery({
    queryKey: ["club-farms"],
    queryFn: fetchClubFarms,
    enabled: open && Boolean(farmId || geneticId),
  });
  const { data: farmGenetics = [] } = useQuery({
    queryKey: ["farm-genetics", farmId],
    queryFn: () => fetchFarmGenetics(farmId),
    enabled: open && Boolean(farmId),
  });
  const { data: jars = [] } = useQuery({
    queryKey: ["club-jars"],
    queryFn: fetchClubJars,
    enabled: open && Boolean(jarId || jarItemId),
  });
  const { data: jarItems = [] } = useQuery({
    queryKey: ["jar-items", jarId],
    queryFn: () => fetchJarItems(jarId),
    enabled: open && Boolean(jarId),
  });
  const catalogMediaSyncedRef = React.useRef(false);
  const categoryOptions = productCategoriesFromList(categories);

  React.useEffect(() => {
    if (!open) return;
    setName(product?.name ?? "");
    setCategory(product?.category ?? "FLOR");
    setUnit(product?.unit === "pack" ? "g" : (product?.unit ?? "g"));
    setIsPack(product?.isPack ?? false);
    setHiddenFromMembers(product?.hiddenFromMembers ?? false);
    setPackItems(packItemsFromProduct(product));
    setGenetics(product?.genetics ?? "");
    setFarmId(product?.farmId ?? "");
    setGeneticId(product?.geneticId ?? "");
    setJarId(product?.jarId ?? "");
    setJarItemId(product?.jarItemId ?? "");
    setOrigin(product?.origin ?? "");
    setPhotos(product?.photos ?? []);
    setVideoUrls(product ? productVideoUrls(product) : []);
    setPendingVideos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.preview));
      return [];
    });
  }, [open, product]);

  React.useEffect(() => {
    if (!open) {
      catalogMediaSyncedRef.current = false;
      return;
    }
    if (catalogMediaSyncedRef.current) return;

    if (geneticId && farmGenetics.length) {
      const genetic = farmGenetics.find((g) => g.id === geneticId);
      if (!genetic) return;
      const farm = farms.find((f) => f.id === (genetic.farmId || farmId));
      const media = resolveProductMedia(productMediaLike(product), genetic, farm);
      setPhotos(media.photos);
      setVideoUrls(media.videoUrls);
      catalogMediaSyncedRef.current = true;
      return;
    }

    if (jarItemId && jarItems.length) {
      const item = jarItems.find((i) => i.id === jarItemId);
      if (!item) return;
      const jar = jars.find((j) => j.id === (item.jarId || jarId));
      const media = resolveProductMedia(productMediaLike(product), item, jar);
      setPhotos(media.photos);
      setVideoUrls(media.videoUrls);
      catalogMediaSyncedRef.current = true;
    }
  }, [
    open,
    product,
    geneticId,
    jarItemId,
    farmId,
    jarId,
    farmGenetics,
    farms,
    jarItems,
    jars,
  ]);

  React.useEffect(
    () => () => {
      pendingVideos.forEach((p) => URL.revokeObjectURL(p.preview));
    },
    [pendingVideos],
  );

  const totalVideos = videoUrls.length + pendingVideos.length;

  function addPhoto(dataUrl: string | null) {
    if (!dataUrl || photos.length >= MAX_PHOTOS) return;
    setPhotos((prev) => [...prev, dataUrl]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function addPendingVideo(file: File) {
    if (totalVideos >= MAX_PRODUCT_VIDEOS) {
      toast.error(`Máximo ${MAX_PRODUCT_VIDEOS} vídeos por producto`);
      return;
    }

    if (product?.id) {
      void uploadVideoNow(product.id, file);
      return;
    }

    setPendingVideos((prev) => [
      ...prev,
      { file, preview: URL.createObjectURL(file) },
    ]);
    toast.info(`Vídeo añadido (${formatFileSize(file.size)}). Se subirá al guardar.`);
  }

  async function uploadVideoNow(productId: string, file: File) {
    const preview = URL.createObjectURL(file);
    setPendingVideos((prev) => [...prev, { file, preview, uploading: true }]);
    setUploadingVideoCount((n) => n + 1);

    const sizeLabel = formatFileSize(file.size);
    const toastId = toast.loading(`Subiendo vídeo (${sizeLabel})… 0%`);

    const up = await uploadProductVideoClient(productId, file, (pct) => {
      toast.loading(`Subiendo vídeo (${sizeLabel})… ${pct}%`, { id: toastId });
    });

    toast.dismiss(toastId);
    setUploadingVideoCount((n) => Math.max(0, n - 1));
    setPendingVideos((prev) => {
      const next = prev.filter((p) => p.preview !== preview);
      URL.revokeObjectURL(preview);
      return next;
    });

    if (up.error || !up.url) {
      toast.error("No se pudo subir el vídeo", { description: up.error });
      return;
    }

    setVideoUrls((prev) => {
      const merged = [...prev, up.url!];
      void syncProductMediaClient(productId, photos, merged).then((sync) => {
        if (sync.error) {
          toast.error("Vídeo subido, pero falló guardar en el producto", {
            description: sync.error,
          });
          return;
        }
        void queryClient.invalidateQueries({ queryKey: ["club-products"] });
        void queryClient.invalidateQueries({ queryKey: ["portal-products"] });
      });
      return merged;
    });

    toast.success("Vídeo subido");
  }

  async function removeVideoUrl(index: number) {
    const url = videoUrls[index];
    if (product?.id && url.startsWith("http")) {
      const res = await removeStorageFileClient(url);
      if (res.error) {
        toast.error("No se pudo quitar el vídeo", { description: res.error });
        return;
      }
    }
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function removePendingVideo(index: number) {
    setPendingVideos((prev) => {
      const item = prev[index];
      if (!item || item.uploading) return prev;
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  }

  function applyCatalogEntryFields(entry: {
    pricePerUnit: number;
    compareAtPrice?: number | null;
    genetics?: FarmGenetic["genetics"];
    thcPercent?: number | null;
    origin?: FarmGenetic["origin"];
    description?: string | null;
  }) {
    setGenetics(entry.genetics ?? "");
    setOrigin(entry.origin ?? "");
    if (priceInputRef.current) {
      priceInputRef.current.value = String(entry.pricePerUnit);
    }
    const compareEl = document.getElementById(
      "compareAtPrice",
    ) as HTMLInputElement | null;
    if (compareEl) {
      compareEl.value =
        entry.compareAtPrice != null && entry.compareAtPrice > 0
          ? String(entry.compareAtPrice)
          : "";
    }
    const thcEl = document.getElementById("thcPercent") as HTMLInputElement | null;
    if (thcEl) {
      thcEl.value =
        entry.thcPercent != null ? String(entry.thcPercent) : "";
    }
    const descEl = document.getElementById(
      "description",
    ) as HTMLTextAreaElement | null;
    if (descEl && entry.description) {
      descEl.value = entry.description;
    }
  }

  function applyJarItemLink(item: JarItem | null, jar?: ProductJar | null) {
    setJarItemId(item?.id ?? "");
    if (!item) return;
    setName(item.name);
    const media = resolveProductMedia(null, item, jar);
    setPhotos(media.photos);
    setVideoUrls(media.videoUrls);
    applyCatalogEntryFields(item);
  }

  function applyGeneticLink(genetic: FarmGenetic | null, farm?: ProductFarm | null) {
    setGeneticId(genetic?.id ?? "");
    if (!genetic) return;
    setName(genetic.name);
    const media = resolveProductMedia(null, genetic, farm);
    setPhotos(media.photos);
    setVideoUrls(media.videoUrls);
    applyCatalogEntryFields(genetic);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const trimmedName = name.trim() || String(formData.get("name") || "").trim();
    if (!trimmedName) {
      toast.error("El nombre es obligatorio");
      nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      nameRef.current?.focus();
      return;
    }

    const stock = Number(formData.get("stock"));
    const pricePerUnit = Number(formData.get("pricePerUnit"));
    const compareRaw = String(formData.get("compareAtPrice") || "").trim();
    const compareAtPrice = compareRaw === "" ? null : Number(compareRaw);
    const lowStockThreshold = Number(formData.get("lowStockThreshold"));

    if (!Number.isFinite(stock) || stock < 0) {
      toast.error("Indica un stock válido");
      return;
    }
    if (!Number.isFinite(pricePerUnit) || pricePerUnit < 0) {
      toast.error("Indica un precio válido");
      return;
    }
    if (
      compareAtPrice != null &&
      (!Number.isFinite(compareAtPrice) ||
        compareAtPrice <= 0 ||
        compareAtPrice <= pricePerUnit)
    ) {
      toast.error("El precio anterior debe ser mayor que el precio de venta");
      return;
    }
    if (isPack && packItems.length === 0) {
      toast.error("Añade al menos un producto al pack");
      return;
    }
    if (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0) {
      toast.error("Indica un umbral de stock bajo válido");
      return;
    }

    if (photos.some((p) => p.length > 1_500_000)) {
      toast.error("Alguna foto es demasiado grande", {
        description: "Usa imágenes más ligeras (máx. ~1,5 MB cada una).",
      });
      return;
    }

    const thcRaw = String(formData.get("thcPercent") || "").trim();
    const thcPercent = thcRaw === "" ? null : Number(thcRaw);
    if (thcRaw !== "" && (!Number.isFinite(thcPercent) || thcPercent! < 0 || thcPercent! > 100)) {
      toast.error("Indica un THC % válido (0–100)");
      return;
    }

    const payload = {
      name: trimmedName,
      category,
      sku: String(formData.get("sku") || ""),
      stock,
      unit: isPack ? "pack" as const : unit,
      isPack,
      hiddenFromMembers,
      packItems: isPack ? packItems : undefined,
      lowStockThreshold,
      pricePerUnit,
      compareAtPrice,
      batch: String(formData.get("batch") || ""),
      expiresAt: String(formData.get("expiresAt") || "") || null,
      photos,
      videoUrls,
      grower: String(formData.get("grower") || ""),
      extractor: String(formData.get("extractor") || ""),
      thcPercent,
      genetics: isCannabisProduct(category, categories) ? genetics || null : null,
      origin: isCannabisProduct(category, categories) ? origin || null : null,
      description: String(formData.get("description") || ""),
      farmId: farmId || null,
      geneticId: geneticId || null,
      jarId: jarId || null,
      jarItemId: jarItemId || null,
    };

    setLoading(true);
    try {
      let productId = product?.id;

      if (mode === "create") {
        const res = await createProductAction(payload);
        if (res.error) {
          toast.error("No se pudo crear el producto", { description: res.error });
          return;
        }
        productId = res.id;
      } else if (product) {
        const res = await updateProductAction(product.id, payload);
        if (res.error) {
          toast.error("No se pudo guardar", { description: res.error });
          return;
        }
      } else {
        toast.error("No se pudo guardar", { description: "Producto no encontrado." });
        return;
      }

      if (productId && pendingVideos.length > 0) {
        const files = pendingVideos.filter((p) => !p.uploading).map((p) => p.file);
        if (files.length > 0) {
          const toastId = toast.loading(
            `Subiendo ${files.length} vídeo${files.length > 1 ? "s" : ""}…`,
          );
          const { urls, errors } = await uploadProductVideosParallel(
            productId,
            files,
            (done, total) => {
              toast.loading(`Subiendo vídeos… ${done}/${total}`, { id: toastId });
            },
          );
          toast.dismiss(toastId);

          if (errors.length) {
            toast.error("Algunos vídeos no se subieron", {
              description: errors[0],
            });
          }

          const finalVideoUrls = [...videoUrls, ...urls];
          if (urls.length > 0) {
            const sync = await syncProductMediaClient(
              productId,
              photos,
              finalVideoUrls,
            );
            if (sync.error) {
              toast.error("Producto guardado, pero falló sincronizar vídeos", {
                description: sync.error,
              });
            } else {
              setVideoUrls(finalVideoUrls);
            }
          }
        }

        pendingVideos.forEach((p) => URL.revokeObjectURL(p.preview));
        setPendingVideos([]);
      }

      await queryClient.invalidateQueries({ queryKey: ["club-products"] });
      await queryClient.invalidateQueries({ queryKey: ["portal-products"] });
      await queryClient.invalidateQueries({ queryKey: ["club-categories"] });
      toast.success(mode === "create" ? "Producto creado" : "Producto actualizado", {
        description: trimmedName,
      });
      setOpen(false);
    } catch (err) {
      toast.error("Error al guardar", {
        description: err instanceof Error ? err.message : "Inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "create" ? "Nuevo producto" : "Editar producto";

  const dialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Añade una referencia al inventario de tu club."
              : "Modifica datos, fotos y vídeos del producto."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              ref={nameRef}
              id="name"
              name="name"
              placeholder="Ej. OG Kush"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5">
            <div>
              <Label htmlFor="isPack" className="cursor-pointer">
                Es un pack
              </Label>
              <p className="text-xs text-muted-foreground">
                Precio fijo con cantidades concretas (ej. 50g a 250 Crd).
              </p>
            </div>
            <input
              id="isPack"
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={isPack}
              onChange={(e) => setIsPack(e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5">
            <div>
              <Label htmlFor="hiddenFromMembers" className="cursor-pointer">
                Oculto para socios
              </Label>
              <p className="text-xs text-muted-foreground">
                No aparece en el menú del portal. Solo tú puedes dispensarlo (TPV o pedidos).
              </p>
            </div>
            <input
              id="hiddenFromMembers"
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={hiddenFromMembers}
              onChange={(e) => setHiddenFromMembers(e.target.checked)}
            />
          </div>

          {isPack && (
            <ProductPackFields
              items={packItems}
              onChange={setPackItems}
              excludeProductId={product?.id}
              enabled={open}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as Product["category"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isPack && (
              <div className="grid gap-2">
                <Label>Venta por</Label>
                <Select
                  value={unit}
                  onValueChange={(v) => setUnit(v as "g" | "ud")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Gramos o unidades" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="stock">{unitInfo.stockLabel}</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min={0}
                step={unitInfo.stockStep}
                defaultValue={product?.stock ?? 0}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pricePerUnit">Precio de venta</Label>
              <Input
                id="pricePerUnit"
                name="pricePerUnit"
                ref={priceInputRef}
                type="number"
                min={0}
                step="0.01"
                defaultValue={product?.pricePerUnit ?? 0}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="compareAtPrice">Precio anterior (opcional)</Label>
              <Input
                id="compareAtPrice"
                name="compareAtPrice"
                type="number"
                min={0}
                step="0.01"
                placeholder="Ej. 12 — se muestra tachado"
                defaultValue={
                  product?.compareAtPrice != null && product.compareAtPrice > 0
                    ? product.compareAtPrice
                    : ""
                }
              />
              <p className="text-xs text-muted-foreground">
                Si es mayor que el precio de venta, los socios verán una oferta con el
                precio tachado.
              </p>
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
                step={unitInfo.stockStep}
                defaultValue={product?.lowStockThreshold ?? 10}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU (opcional)</Label>
              <Input
                id="sku"
                name="sku"
                placeholder="FL-OGK"
                defaultValue={product?.sku}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="batch">Lote (opcional)</Label>
              <Input
                id="batch"
                name="batch"
                placeholder="L-2605"
                defaultValue={product?.batch === "—" ? "" : product?.batch}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expiresAt">Caducidad (opcional)</Label>
              <Input
                id="expiresAt"
                name="expiresAt"
                type="date"
                defaultValue={product?.expiresAt ?? ""}
              />
            </div>
          </div>

          {!isPack && isCannabisProduct(category, categories) && (
            <ProductGeneticLinkFields
              farmId={farmId}
              geneticId={geneticId}
              onFarmChange={setFarmId}
              onGeneticChange={(g, farm) => {
                if (g) setFarmId(g.farmId);
                applyGeneticLink(g, farm);
              }}
              enabled={open}
            />
          )}

          {!isPack && (
            <ProductJarLinkFields
              jarId={jarId}
              jarItemId={jarItemId}
              onJarChange={setJarId}
              onItemChange={(item, jar) => {
                if (item) setJarId(item.jarId);
                applyJarItemLink(item, jar);
              }}
              enabled={open}
            />
          )}

          {!isPack && isCannabisProduct(category, categories) && (
            <ProductStrainFields
              product={product}
              genetics={genetics}
              origin={origin}
              onGeneticsChange={setGenetics}
              onOriginChange={setOrigin}
            />
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <ImagePlus className="h-4 w-4" /> Fotos (máx. {MAX_PHOTOS})
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {photos.map((url, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Foto ${i + 1}`}
                    className="aspect-[4/3] w-full rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <PhotoUpload
                  label="Añadir foto"
                  value={null}
                  onChange={addPhoto}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Video className="h-4 w-4" /> Vídeos (máx. {MAX_PRODUCT_VIDEOS})
            </Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {videoUrls.map((url, i) => (
                <div key={url} className="relative overflow-hidden rounded-xl border border-border">
                  <video
                    src={url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="aspect-video w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeVideoUrl(i)}
                    className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {pendingVideos.map((pending, i) => (
                <div key={pending.preview} className="relative overflow-hidden rounded-xl border border-dashed border-primary/40">
                  <video
                    src={pending.preview}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="aspect-video w-full object-cover opacity-80"
                  />
                  {pending.uploading && (
                    <span className="absolute inset-0 grid place-items-center bg-background/60 text-xs font-medium">
                      <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
                      Subiendo…
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={pending.uploading}
                    onClick={() => removePendingVideo(i)}
                    className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-destructive disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                for (const f of files) addPendingVideo(f);
                e.target.value = "";
              }}
            />
            {totalVideos < MAX_PRODUCT_VIDEOS && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => videoInputRef.current?.click()}
              >
                <Video className="h-4 w-4" /> Añadir vídeo
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Máximo {maxVideoSizeLabel()} por vídeo. MP4, MOV, WebM… Se reproducen en bucle en el menú.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || uploadingVideoCount > 0}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Crear producto" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  return dialog;
}

export function CreateProductDialog() {
  return (
    <ProductFormDialog
      mode="create"
      trigger={
        <Button size="sm">
          <Plus className="h-4 w-4" /> Nuevo producto
        </Button>
      }
    />
  );
}

export function EditProductDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <ProductFormDialog
      mode="edit"
      product={product}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
