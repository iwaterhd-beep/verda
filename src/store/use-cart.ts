"use client";

import { create } from "zustand";
import type { CartItem, Product } from "@/types";

function gramsOf(items: CartItem[]) {
  return items
    .filter((i) => i.unit === "g")
    .reduce((a, i) => a + i.qty, 0);
}

interface CartState {
  items: CartItem[];
  add: (product: Product) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: () => number;
  total: () => number;
  grams: () => number;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  add: (product) =>
    set((s) => {
      const existing = s.items.find((i) => i.productId === product.id);
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.productId === product.id ? { ...i, qty: i.qty + 1 } : i,
          ),
        };
      }
      const item: CartItem = {
        productId: product.id,
        name: product.name,
        category: product.category,
        unit: product.unit,
        pricePerUnit: product.pricePerUnit,
        qty: 1,
      };
      return { items: [...s.items, item] };
    }),
  decrement: (productId) =>
    set((s) => ({
      items: s.items.flatMap((i) =>
        i.productId === productId
          ? i.qty > 1
            ? [{ ...i, qty: i.qty - 1 }]
            : []
          : [i],
      ),
    })),
  remove: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
  clear: () => set({ items: [] }),
  count: () => get().items.reduce((a, i) => a + i.qty, 0),
  total: () => get().items.reduce((a, i) => a + i.qty * i.pricePerUnit, 0),
  grams: () => gramsOf(get().items),
}));
