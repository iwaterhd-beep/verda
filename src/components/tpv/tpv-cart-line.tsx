"use client";

import * as React from "react";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { fmtLineQty } from "@/lib/product-packs";

function parseDecimal(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function roundGramQty(qty: number) {
  return Math.round(qty * 100) / 100;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export interface TpvCartLineData {
  id: string;
  name: string;
  price: number;
  qty: number;
  unit: "g" | "ud" | "pack";
}

interface TpvCartLineProps {
  line: TpvCartLineData;
  maxQty?: number;
  onQtyChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}

export function TpvCartLine({
  line,
  maxQty,
  onQtyChange,
  onRemove,
  onIncrement,
  onDecrement,
}: TpvCartLineProps) {
  if (line.unit === "g") {
    return (
      <GramLine
        line={line}
        maxQty={maxQty}
        onQtyChange={onQtyChange}
        onRemove={onRemove}
      />
    );
  }

  const lineTotal = roundMoney(line.price * line.qty);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{line.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(line.price)}/{line.unit}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onDecrement(line.id)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm tabular-nums">
          {line.qty}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onIncrement(line.id)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <span className="w-20 text-right text-sm font-medium tabular-nums">
        {formatCurrency(lineTotal)}
      </span>
    </div>
  );
}

function GramLine({
  line,
  maxQty,
  onQtyChange,
  onRemove,
}: {
  line: TpvCartLineData;
  maxQty?: number;
  onQtyChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const [gramsText, setGramsText] = React.useState("");
  const [priceText, setPriceText] = React.useState("");
  const [gramsFocused, setGramsFocused] = React.useState(false);
  const [priceFocused, setPriceFocused] = React.useState(false);

  const clampQty = React.useCallback(
    (qty: number) => {
      const rounded = roundGramQty(Math.max(0, qty));
      if (maxQty != null && maxQty >= 0) {
        return roundGramQty(Math.min(rounded, maxQty));
      }
      return rounded;
    },
    [maxQty],
  );

  React.useEffect(() => {
    if (!gramsFocused) {
      setGramsText(line.qty > 0 ? line.qty.toFixed(2) : "");
    }
  }, [line.qty, gramsFocused]);

  React.useEffect(() => {
    if (!priceFocused) {
      const total = roundMoney(line.qty * line.price);
      setPriceText(line.qty > 0 ? total.toFixed(2) : "");
    }
  }, [line.qty, line.price, priceFocused]);

  function applyQty(nextQty: number) {
    onQtyChange(line.id, clampQty(nextQty));
  }

  function handleGramsChange(raw: string) {
    setGramsText(raw);
    const parsed = parseDecimal(raw);
    if (parsed == null) {
      applyQty(0);
      return;
    }
    applyQty(parsed);
  }

  function handlePriceChange(raw: string) {
    setPriceText(raw);
    const parsed = parseDecimal(raw);
    if (parsed == null) {
      applyQty(0);
      return;
    }
    if (line.price <= 0) return;
    applyQty(parsed / line.price);
  }

  const lineTotal = roundMoney(line.qty * line.price);

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/10 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{line.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(line.price)}/g
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground"
          onClick={() => onRemove(line.id)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Gramos
          </label>
          <div className="relative">
            <Input
              inputMode="decimal"
              placeholder="0,00"
              className="h-9 pr-7 tabular-nums"
              value={gramsText}
              onFocus={() => setGramsFocused(true)}
              onBlur={() => setGramsFocused(false)}
              onChange={(e) => handleGramsChange(e.target.value)}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              g
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Precio
          </label>
          <Input
            inputMode="decimal"
            placeholder="0,00"
            className="h-9 tabular-nums"
            value={priceText}
            onFocus={() => setPriceFocused(true)}
            onBlur={() => setPriceFocused(false)}
            onChange={(e) => handlePriceChange(e.target.value)}
          />
        </div>
      </div>

      {line.qty > 0 && (
        <p className="text-xs text-muted-foreground tabular-nums">
          {fmtLineQty(line.qty, "g")} · {formatCurrency(lineTotal)}
        </p>
      )}
    </div>
  );
}
