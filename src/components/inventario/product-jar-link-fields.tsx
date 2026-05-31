"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchClubJars,
  fetchJarItems,
} from "@/lib/data/product-jars";
import type { JarItem, ProductJar } from "@/types";

interface ProductJarLinkFieldsProps {
  jarId: string;
  jarItemId: string;
  onJarChange: (jarId: string) => void;
  onItemChange: (item: JarItem | null, jar?: ProductJar | null) => void;
  enabled?: boolean;
}

export function ProductJarLinkFields({
  jarId,
  jarItemId,
  onJarChange,
  onItemChange,
  enabled = true,
}: ProductJarLinkFieldsProps) {
  const { data: jars = [] } = useQuery({
    queryKey: ["club-jars"],
    queryFn: fetchClubJars,
    enabled,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["jar-items", jarId],
    queryFn: () => fetchJarItems(jarId),
    enabled: enabled && Boolean(jarId),
  });

  if (!jars.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-secondary/10 p-3">
      <div className="col-span-2">
        <p className="text-xs text-muted-foreground">
          Vincula a un ítem del catálogo Jars (precio y ficha en el menú).
        </p>
      </div>
      <div className="grid gap-2">
        <Label>Jar</Label>
        <Select
          value={jarId || "none"}
          onValueChange={(v) => {
            onJarChange(v === "none" ? "" : v);
            onItemChange(null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Opcional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {jars.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Ítem</Label>
        <Select
          value={jarItemId || "none"}
          disabled={!jarId}
          onValueChange={(v) => {
            const item =
              items.find((g) => g.id === v) ?? null;
            const jar =
              item ? jars.find((j) => j.id === item.jarId) ?? null : null;
            onItemChange(v === "none" ? null : item, jar);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={jarId ? "Elige" : "Elige jar"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {items.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
