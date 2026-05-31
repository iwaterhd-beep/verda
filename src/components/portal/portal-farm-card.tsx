"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { farmHasMedia } from "@/lib/product-farms";
import type { ProductFarm } from "@/types";

interface PortalFarmCardProps {
  farm: ProductFarm;
  /** Si se omite, la tarjeta filtra el menú por esta farm. */
  href?: string;
  onSelect?: (farmId: string) => void;
  geneticsCount?: number;
}

export function PortalFarmCard({
  farm,
  href,
  onSelect,
  geneticsCount,
}: PortalFarmCardProps) {
  const thumb = farm.photos[0] ?? null;
  const target = href ?? `/portal/menu?farm=${encodeURIComponent(farm.id)}`;

  const inner = (
    <Card className="overflow-hidden transition-colors hover:border-emerald-500/40">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-emerald-500/10">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : farm.videoUrls[0] ? (
            <video
              src={farm.videoUrls[0]}
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-2xl">
              🌱
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{farm.name}</p>
          {farm.description ? (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {farm.description}
            </p>
          ) : geneticsCount != null ? (
            <p className="text-xs text-muted-foreground">
              {geneticsCount}{" "}
              {geneticsCount === 1 ? "genética" : "genéticas"}
            </p>
          ) : farmHasMedia(farm) ? (
            <p className="text-xs text-muted-foreground">Ver catálogo</p>
          ) : null}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );

  if (onSelect) {
    return (
      <button type="button" className="block w-full text-left" onClick={() => onSelect(farm.id)}>
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
