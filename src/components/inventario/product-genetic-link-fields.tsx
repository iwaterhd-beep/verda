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
  fetchClubFarms,
  fetchFarmGenetics,
} from "@/lib/data/product-farms";
import type { FarmGenetic } from "@/types";

interface ProductGeneticLinkFieldsProps {
  farmId: string;
  geneticId: string;
  onFarmChange: (farmId: string) => void;
  onGeneticChange: (genetic: FarmGenetic | null) => void;
  enabled?: boolean;
}

export function ProductGeneticLinkFields({
  farmId,
  geneticId,
  onFarmChange,
  onGeneticChange,
  enabled = true,
}: ProductGeneticLinkFieldsProps) {
  const { data: farms = [] } = useQuery({
    queryKey: ["club-farms"],
    queryFn: fetchClubFarms,
    enabled,
  });

  const { data: genetics = [] } = useQuery({
    queryKey: ["farm-genetics", farmId],
    queryFn: () => fetchFarmGenetics(farmId),
    enabled: enabled && Boolean(farmId),
  });

  if (!farms.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-secondary/10 p-3">
      <div className="col-span-2">
        <p className="text-xs text-muted-foreground">
          Vincula a una genética del catálogo Farms (precio y ficha en el menú).
        </p>
      </div>
      <div className="grid gap-2">
        <Label>Farm</Label>
        <Select
          value={farmId || "none"}
          onValueChange={(v) => {
            onFarmChange(v === "none" ? "" : v);
            onGeneticChange(null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Opcional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {farms.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Genética</Label>
        <Select
          value={geneticId || "none"}
          disabled={!farmId}
          onValueChange={(v) => {
            const genetic =
              genetics.find((g) => g.id === v) ?? null;
            onGeneticChange(v === "none" ? null : genetic);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={farmId ? "Elige" : "Elige farm"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {genetics.map((g) => (
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
