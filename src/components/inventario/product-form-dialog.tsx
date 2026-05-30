"use client";

import * as React from "react";
import { Plus, Loader2, Pencil, Trash2, ImagePlus, Video, X } from "lucide-react";
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
import { PhotoUpload } from "@/components/applications/photo-upload";
import {
  createProductAction,
  updateProductAction,
  uploadProductVideoAction,
  removeProductVideoAction,
} from "@/app/(dashboard)/inventario/actions";
import type { Product } from "@/types";

const categories: { value: Product["category"]; label: string }[] = [
  { value: "FLOR", label: "Flor" },
  { value: "EXTRACTO", label: "Extracto" },
  { value: "COMESTIBLE", label: "Comestible" },
  { value: "MERCH", label: "Merch" },
  { value: "OTRO", label: "Otro" },
];

const MAX_PHOTOS = 4;

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
  const [category, setCategory] = React.useState<Product["category"]>(
    product?.category ?? "FLOR",
  );
  const [unit, setUnit] = React.useState<Product["unit"]>(product?.unit ?? "g");
  const [photos, setPhotos] = React.useState<string[]>(product?.photos ?? []);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(
    product?.videoUrl ?? null,
  );
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = React.useState<string | null>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!open) return;
    setCategory(product?.category ?? "FLOR");
    setUnit(product?.unit ?? "g");
    setPhotos(product?.photos ?? []);
    setVideoUrl(product?.videoUrl ?? null);
    setVideoFile(null);
    setVideoBlobUrl(null);
  }, [open, product]);

  React.useEffect(() => {
    if (!videoFile) {
      setVideoBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const videoPreview = videoBlobUrl ?? videoUrl;

  function addPhoto(dataUrl: string | null) {
    if (!dataUrl || photos.length >= MAX_PHOTOS) return;
    setPhotos((prev) => [...prev, dataUrl]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    if (!name) {
      toast.error("El nombre es obligatorio");
      return;
    }

    const payload = {
      name,
      category,
      sku: String(form.get("sku") || ""),
      stock: Number(form.get("stock") || 0),
      unit,
      lowStockThreshold: Number(form.get("lowStockThreshold") || 10),
      pricePerUnit: Number(form.get("pricePerUnit") || 0),
      batch: String(form.get("batch") || ""),
      expiresAt: String(form.get("expiresAt") || "") || null,
      photos,
      videoUrl,
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
      }

      if (videoFile && productId) {
        const fd = new FormData();
        fd.append("video", videoFile);
        const up = await uploadProductVideoAction(productId, fd);
        if (up.error) {
          toast.error("Producto guardado, pero falló el vídeo", {
            description: up.error,
          });
        } else if (up.url) {
          setVideoUrl(up.url);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["club-products"] });
      await queryClient.invalidateQueries({ queryKey: ["portal-products"] });
      toast.success(mode === "create" ? "Producto creado" : "Producto actualizado", {
        description: name,
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveVideo() {
    if (videoFile) {
      setVideoFile(null);
      return;
    }
    if (!product?.id || !videoUrl) {
      setVideoUrl(null);
      return;
    }
    setLoading(true);
    try {
      const res = await removeProductVideoAction(product.id);
      if (res.error) {
        toast.error("No se pudo quitar el vídeo", { description: res.error });
        return;
      }
      setVideoUrl(null);
      setVideoFile(null);
      toast.success("Vídeo eliminado");
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
              : "Modifica datos, fotos o vídeo del producto."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ej. OG Kush"
              defaultValue={product?.name}
              required
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
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min={0}
                step="0.01"
                defaultValue={product?.stock ?? 0}
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
                defaultValue={product?.pricePerUnit ?? 0}
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
                defaultValue={product?.lowStockThreshold ?? 10}
                required
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
              <Video className="h-4 w-4" /> Vídeo (se reproduce en bucle en el menú)
            </Label>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setVideoFile(f);
                e.target.value = "";
              }}
            />
            {videoPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <video
                  src={videoPreview}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="aspect-video w-full object-cover"
                />
                <div className="absolute right-2 top-2 flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    Cambiar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={handleRemoveVideo}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => videoInputRef.current?.click()}
              >
                <Video className="h-4 w-4" /> Subir vídeo
              </Button>
            )}
            <p className="text-xs text-muted-foreground">Máximo 25 MB · MP4, WebM…</p>
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
