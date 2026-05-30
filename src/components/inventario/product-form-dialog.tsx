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
  removeStorageFileClient,
  syncProductMediaClient,
  productVideoUrls,
} from "@/lib/data/product-media";
import {
  MAX_PRODUCT_PHOTOS,
  MAX_PRODUCT_VIDEOS,
  maxVideoSizeLabel,
} from "@/lib/product-media-limits";
import { ProductStrainFields } from "@/components/inventario/product-strain-fields";
import { isCannabisProduct } from "@/lib/product-strain";
import { productCategoriesFromList, unitMeta, unitOptions } from "@/lib/product-meta";
import { fetchClubCategories } from "@/lib/data/product-categories";
import type { ProductGenetics, ProductOrigin } from "@/lib/product-strain";
import type { Product } from "@/types";

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
  const [category, setCategory] = React.useState<Product["category"]>(
    product?.category ?? "FLOR",
  );
  const [unit, setUnit] = React.useState<Product["unit"]>(product?.unit ?? "g");
  const unitInfo = unitMeta(unit);
  const [genetics, setGenetics] = React.useState<ProductGenetics | "">(
    product?.genetics ?? "",
  );
  const [origin, setOrigin] = React.useState<ProductOrigin | "">(
    product?.origin ?? "",
  );
  const [photos, setPhotos] = React.useState<string[]>(product?.photos ?? []);
  const [videoUrls, setVideoUrls] = React.useState<string[]>(() =>
    product ? productVideoUrls(product) : [],
  );
  const [pendingVideos, setPendingVideos] = React.useState<
    { file: File; preview: string }[]
  >([]);
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery({
    queryKey: ["club-categories"],
    queryFn: fetchClubCategories,
    enabled: open,
  });
  const categoryOptions = productCategoriesFromList(categories);

  React.useEffect(() => {
    if (!open) return;
    setName(product?.name ?? "");
    setCategory(product?.category ?? "FLOR");
    setUnit(product?.unit ?? "g");
    setGenetics(product?.genetics ?? "");
    setOrigin(product?.origin ?? "");
    setPhotos(product?.photos ?? []);
    setVideoUrls(product ? productVideoUrls(product) : []);
    setPendingVideos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.preview));
      return [];
    });
  }, [open, product]);

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
    setPendingVideos((prev) => [
      ...prev,
      { file, preview: URL.createObjectURL(file) },
    ]);
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
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
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
    const lowStockThreshold = Number(formData.get("lowStockThreshold"));

    if (!Number.isFinite(stock) || stock < 0) {
      toast.error("Indica un stock válido");
      return;
    }
    if (!Number.isFinite(pricePerUnit) || pricePerUnit < 0) {
      toast.error("Indica un precio válido");
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
      unit,
      lowStockThreshold,
      pricePerUnit,
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

      if (productId) {
        let finalVideoUrls = [...videoUrls];
        for (const pending of pendingVideos) {
          const up = await uploadProductVideoClient(productId, pending.file);
          if (up.error) {
            toast.error("Producto guardado, pero falló un vídeo", {
              description: up.error,
            });
          } else if (up.url) {
            finalVideoUrls.push(up.url);
          }
        }

        if (
          pendingVideos.length > 0 ||
          finalVideoUrls.length !== videoUrls.length
        ) {
          const sync = await syncProductMediaClient(
            productId,
            photos,
            finalVideoUrls,
          );
          if (sync.error) {
            toast.error("Producto guardado, pero falló sincronizar vídeos", {
              description: sync.error,
            });
          }
        }
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
            <div className="grid gap-2">
              <Label>Venta por</Label>
              <Select
                value={unit}
                onValueChange={(v) => setUnit(v as Product["unit"])}
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
              <Label htmlFor="pricePerUnit">{unitInfo.priceLabel}</Label>
              <Input
                id="pricePerUnit"
                name="pricePerUnit"
                type="number"
                min={0}
                step="0.01"
                defaultValue={product?.pricePerUnit ?? 0}
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

          {isCannabisProduct(category, categories) && (
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
                    className="aspect-video w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePendingVideo(i)}
                    className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-destructive"
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
              Máximo {maxVideoSizeLabel()} por vídeo · MP4, WebM… Se reproducen en bucle en el menú.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
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
