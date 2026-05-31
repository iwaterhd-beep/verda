"use client";

import * as React from "react";
import { ImagePlus, Video, X, Loader2 } from "lucide-react";
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
  maxVideoSizeLabel,
} from "@/lib/product-media-limits";
import { formatCurrency } from "@/lib/utils";

interface CatalogMediaFieldsProps {
  photos: string[];
  videoUrls: string[];
  onPhotosChange: (photos: string[]) => void;
  onVideoUrlsChange: (urls: string[]) => void;
  storagePrefix: string;
  maxPhotos?: number;
  maxVideos?: number;
}

export function CatalogMediaFields({
  photos,
  videoUrls,
  onPhotosChange,
  onVideoUrlsChange,
  storagePrefix,
  maxPhotos = MAX_PRODUCT_PHOTOS,
  maxVideos = MAX_PRODUCT_VIDEOS,
}: CatalogMediaFieldsProps) {
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingVideos, setUploadingVideos] = React.useState(0);

  function addPhoto(dataUrl: string | null) {
    if (!dataUrl || photos.length >= maxPhotos) return;
    onPhotosChange([...photos, dataUrl]);
  }

  function removePhoto(index: number) {
    onPhotosChange(photos.filter((_, i) => i !== index));
  }

  async function removeVideo(url: string) {
    await removeStorageFileClient(url);
    onVideoUrlsChange(videoUrls.filter((u) => u !== url));
  }

  async function handleVideoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (videoUrls.length + files.length > maxVideos) {
      toast.error(`Máximo ${maxVideos} vídeos`);
      return;
    }

    setUploadingVideos(files.length);
    const next = [...videoUrls];
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`Vídeo demasiado grande (máx. ${maxVideoSizeLabel()})`);
        continue;
      }
      const res = await uploadCatalogVideoClient(storagePrefix, file);
      if (res.error) toast.error(res.error);
      else if (res.url) next.push(res.url);
    }
    onVideoUrlsChange(next);
    setUploadingVideos(0);
    if (videoInputRef.current) videoInputRef.current.value = "";
  }

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
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
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
          {videoUrls.length < maxVideos && (
            <button
              type="button"
              disabled={uploadingVideos > 0}
              onClick={() => videoInputRef.current?.click()}
              className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/20 text-xs text-muted-foreground hover:border-primary/40"
            >
              {uploadingVideos > 0 ? (
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
        {uploadingVideos > 0 && (
          <p className="text-xs text-muted-foreground">
            Subiendo {uploadingVideos} vídeo(s)…
          </p>
        )}
      </div>
    </div>
  );
}
