"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileSubpage({
  title,
  description,
  backHref = "/portal/perfil",
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-10 -mx-4 border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="touch-target shrink-0" asChild>
            <Link href={backHref} aria-label="Volver al perfil">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
