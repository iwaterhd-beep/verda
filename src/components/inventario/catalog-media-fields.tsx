"use client";

import * as React from "react";
import { ImagePlus, Video, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { PhotoUpload } from "@/components/applications/photo-upload";
import {
  removeStorageFileClient,
  uploadCatalogVideoClient,
} from "@/lib/data/product-media";
import {
  MAX_PRODUCT_PHOTOS,
  MAX_PRODUCT_VIDEOS,
  MAX_VIDEO_BYTES,
  isVideoFile,
  maxVideoSizeLabel,
} from "@/lib/product-media-limits";
import { formatFileSize } from "@/lib/utils";

interface PendingVideo {
  file: File;
  preview: string;
  uploading?: boolean;
}

interface CatalogMediaFieldsProps {
  photos: string[];
  videoUrls: string[];
  onPhotosChange: (photos: string[]) => void;
  onVideoUrlsChange: (urls: string[]) => void;
  storagePrefix: string;
  /** Si true, los vídeos se encolan hasta guardar (farm/genética nueva). */
  deferUpload?: boolean;
  onPendingVideosChange?: (files: File[]) => void;
  maxPhotos?: number;
  maxVideos?: number;
}

export function CatalogMediaFields({
  photos,
  videoUrls,
  onPhotosChange,
  onVideoUrlsChange,
  storagePrefix,
  deferUpload = false,
  onPendingVideosChange,
  maxPhotos = MAX_PRODUCT_PHOTOS,
  maxVideos = MAX_PRODUCT_VIDEOS,
}: CatalogMediaFieldsProps) {
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = React.useState(0);
  const [localPending, setLocalPending] = React.useState<PendingVideo[]>([]);

  const totalVideos = videoUrls.length + localPending.length;

  React.useEffect(
    () => () => {
      localPending.forEach((p) => URL.revokeObjectURL(p.preview));
    },
    [localPending],
  );

  function syncPending(next: PendingVideo[]) {
    setLocalPending(next);
    onPendingVideosChange?.(next.map((p) => p.file));
  }

  function addPhoto(dataUrl: string | null) {
    if (!dataUrl || photos.length >= maxPhotos) return;
    onPhotosChange([...photos, dataUrl]);
  }

  function removePhoto(index: number) {
    onPhotosChange(photos.filter((_, i) => i !== index));
  }

  async function removeVideo(url: string) {
    if (url.startsWith("http")) {
      await removeStorageFileClient(url);
    }
    onVideoUrlsChange(videoUrls.filter((u) => u !== url));
  }

  function removePending(index: number) {
    const next = [...localPending];
    URL.revokeObjectURL(next[index].preview);
    next.splice(index, 1);
    syncPending(next);
  }

  async function uploadNow(file: File) {
    if (!isVideoFile(file)) {
      toast.error("El archivo debe ser un vídeo (mp4, mov, webm…)");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error(`Vídeo demasiado grande (máx. ${maxVideoSizeLabel()})`);
      return;
    }

    setUploadingCount((n) => n + 1);
    const toastId = toast.loading(`Subiendo vídeo (${formatFileSize(file.size)})…`);
    const res = await uploadCatalogVideoClient(storagePrefix, file, (pct) => {
      toast.loading(`Subiendo vídeo… ${pct}%`, { id: toastId });
    });
    toast.dismiss(toastId);
    setUploadingCount((n) => Math.max(0, n - 1));

    if (res.error || !res.url) {
      toast.error("No se pudo subir el vídeo", { description: res.error });
      return;
    }

    onVideoUrlsChange([...videoUrls, res.url]);
    toast.success("Vídeo subido");
  }

  async function handleVideoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    if (totalVideos + files.length > maxVideos) {
      toast.error(`Máximo ${maxVideos} vídeos`);
      return;
    }

    for (const file of files) {
      if (!isVideoFile(file)) {
        toast.error(`${file.name}: no es un vídeo válido`);
        continue;
      }
      if (file.size > MAX_VIDEO_BYTES) {
        toast.error(`${file.name}: supera ${maxVideoSizeLabel()}`);
        continue;
      }

      if (deferUpload) {
        const next = [
          ...localPending,
          { file, preview: URL.createObjectURL(file) },
        ];
        syncPending(next);
        toast.info(`Vídeo añadido (${formatFileSize(file.size)}). Se subirá al guardar.`);
      } else {
        await uploadNow(file);
      }
    }

    if (videoInputRef.current) videoInputRef.current.value = "";
  }

  const pendingPreview = deferUpload ? localPending : [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <ImagePlus className="h-4 w-4" /> Fotos (máx. {maxPhotos})
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
          {photos.length < maxPhotos && (
            <PhotoUpload label="Añadir foto" value={null} onChange={addPhoto} />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Video className="h-4 w-4" /> Vídeos (máx. {maxVideos})
        </Label>
        {deferUpload && (
          <p className="text-xs text-muted-foreground">
            Los vídeos se suben al pulsar «Crear farm» o «Guardar».
          </p>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*,.mp4,.mov,.webm,.m4v"
          multiple
          className="hidden"
          onChange={handleVideoFiles}
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {videoUrls.map((url) => (
            <div
              key={url}
              className="relative overflow-hidden rounded-xl border border-border"
            >
              <video
                src={url}
                controls
                playsInline
                className="aspect-video w-full bg-black object-contain"
              />
              <button
                type="button"
                onClick={() => void removeVideo(url)}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {pendingPreview.map((pending, i) => (
            <div
              key={pending.preview}
              className="relative overflow-hidden rounded-xl border border-dashed border-primary/40"
            >
              <video
                src={pending.preview}
                autoPlay
                loop
                muted
                playsInline
                className="aspect-video w-full bg-black object-cover opacity-90"
              />
              <span className="absolute bottom-1 left-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px]">
                Pendiente
              </span>
              <button
                type="button"
                onClick={() => removePending(i)}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {totalVideos < maxVideos && (
            <button
              type="button"
              disabled={uploadingCount > 0}
              onClick={() => videoInputRef.current?.click()}
              className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/20 text-xs text-muted-foreground hover:border-primary/40"
            >
              {uploadingCount > 0 ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Video className="h-5 w-5" />
                  Subir vídeo
                  <span className="text-[10px]">Máx. {maxVideoSizeLabel()}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
