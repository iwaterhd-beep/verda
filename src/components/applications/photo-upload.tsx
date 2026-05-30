"use client";

import * as React from "react";
import { Camera, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { fileToCompressedDataUrl } from "@/lib/image";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  capture?: "user" | "environment";
  className?: string;
}

export function PhotoUpload({
  label,
  value,
  onChange,
  capture,
  className,
}: PhotoUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      onChange(dataUrl);
    } catch {
      toast.error("No se pudo procesar la imagen");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={capture}
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed transition-colors",
          value
            ? "border-primary/50"
            : "border-border bg-secondary/30 hover:border-primary/40 hover:bg-secondary/50",
        )}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3.5 w-3.5" />
            </span>
          </>
        ) : loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <Camera className="h-6 w-6 text-muted-foreground" />
            <span className="px-2 text-center text-xs text-muted-foreground">
              {label}
            </span>
          </>
        )}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-1.5 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="h-3 w-3" /> Quitar foto
        </button>
      )}
    </div>
  );
}
