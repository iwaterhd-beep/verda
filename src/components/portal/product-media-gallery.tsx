"use client";

import * as React from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  productPhotos,
  productVideoUrls,
} from "@/lib/data/product-media";
import type { Product } from "@/types";

type MediaItem =
  | { type: "video"; url: string }
  | { type: "photo"; url: string };

function buildMediaItems(product: Product): MediaItem[] {
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

export function ProductMediaGallery({ product }: { product: Product }) {
  const items = buildMediaItems(product);
  const [active, setActive] = React.useState(0);

  if (!items.length) return null;

  const current = items[active] ?? items[0];

  return (
    <div>
      <div className="relative aspect-[16/9] w-full bg-secondary">
        {current.type === "video" ? (
          <video
            key={current.url}
            src={current.url}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.url}
            src={current.url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {items.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto border-t border-border/60 px-3 py-2">
          {items.map((item, i) => (
            <button
              key={`${item.type}-${item.url}`}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                i === active ? "border-primary" : "border-transparent opacity-70",
              )}
            >
              {item.type === "video" ? (
                <>
                  <video
                    src={item.url}
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 grid place-items-center bg-black/30">
                    <Play className="h-4 w-4 text-white" />
                  </span>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
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
