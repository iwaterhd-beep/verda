"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { jarHasMedia } from "@/lib/product-jars";
import type { ProductJar } from "@/types";

interface PortalJarCardProps {
  jar: ProductJar;
  /** Si se omite, la tarjeta filtra el menú por esta jar. */
  href?: string;
  onSelect?: (jarId: string) => void;
  itemsCount?: number;
}

export function PortalJarCard({
  jar,
  href,
  onSelect,
  itemsCount,
}: PortalJarCardProps) {
  const thumb = jar.photos[0] ?? null;
  const target = href ?? `/portal/menu?jar=${encodeURIComponent(jar.id)}`;

  const inner = (
    <Card className="overflow-hidden transition-colors hover:border-emerald-500/40">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-emerald-500/10">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : jar.videoUrls[0] ? (
            <video
              src={jar.videoUrls[0]}
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-2xl">
              🫙
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{jar.name}</p>
          {jar.description ? (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {jar.description}
            </p>
          ) : itemsCount != null ? (
            <p className="text-xs text-muted-foreground">
              {itemsCount}{" "}
              {itemsCount === 1 ? "ítem" : "ítems"}
            </p>
          ) : jarHasMedia(jar) ? (
            <p className="text-xs text-muted-foreground">Ver catálogo</p>
          ) : null}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );

  if (onSelect) {
    return (
      <button type="button" className="block w-full text-left" onClick={() => onSelect(jar.id)}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={target} className="block">
      {inner}
    </Link>
  );
}
