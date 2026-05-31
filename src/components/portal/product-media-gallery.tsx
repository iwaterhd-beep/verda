"use client";

import * as React from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  productPhotos,
  productVideoUrls,
} from "@/lib/data/product-media";
import { ProtectedImage, ProtectedVideo } from "@/components/portal/protected-media";
import type { Product } from "@/types";

type MediaItem =
  | { type: "video"; url: string }
  | { type: "photo"; url: string };

export function buildProductMediaItems(product: Product): MediaItem[] {
  return [
    ...productVideoUrls(product).map((url) => ({
      type: "video" as const,
      url,
    })),
    ...productPhotos(product).map((url) => ({
      type: "photo" as const,
      url,
    })),
  ];
}

interface ProductMediaGalleryProps {
  product: Product;
  variant?: "card" | "detail";
  className?: string;
}

export function ProductMediaGallery({
  product,
  variant = "card",
  className,
}: ProductMediaGalleryProps) {
  const items = buildProductMediaItems(product);
  const [active, setActive] = React.useState(0);

  if (!items.length) return null;

  const current = items[active] ?? items[0];
  const isDetail = variant === "detail";
  const aspect = isDetail ? "aspect-[4/5] sm:aspect-video" : "aspect-[16/9]";
  const thumbSize = isDetail ? "h-16 w-16" : "h-12 w-12";

  return (
    <div className={cn(className, "select-none")}>
      <div className={cn("relative w-full overflow-hidden bg-secondary", aspect)}>
        {current.type === "video" ? (
          <ProtectedVideo
            key={current.url}
            src={current.url}
            autoPlay
            loop
            muted={!isDetail}
            showControls={isDetail}
          />
        ) : (
          <ProtectedImage key={current.url} src={current.url} alt={product.name} />
        )}
      </div>

      {items.length > 1 && (
        <div
          className={cn(
            "portal-scroll-x flex gap-2 border-t border-border/60 px-3 py-2",
            isDetail && "px-0 py-3",
          )}
        >
          {items.map((item, i) => (
            <button
              key={`${item.type}-${item.url}`}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "portal-protected-media relative shrink-0 overflow-hidden rounded-lg border-2 transition-colors touch-manipulation",
                thumbSize,
                i === active ? "border-primary" : "border-transparent opacity-70",
              )}
            >
              {item.type === "video" ? (
                <>
                  <ProtectedVideo src={item.url} muted />
                  <span className="absolute inset-0 z-20 grid place-items-center bg-black/30">
                    <Play className="h-4 w-4 text-white" />
                  </span>
                </>
              ) : (
                <ProtectedImage src={item.url} alt="" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function productMediaThumb(product: Product): {
  type: "video" | "photo" | null;
  url: string | null;
} {
  const videos = productVideoUrls(product);
  if (videos[0]) return { type: "video", url: videos[0] };
  const photos = productPhotos(product);
  if (photos[0]) return { type: "photo", url: photos[0] };
  return { type: null, url: null };
}
