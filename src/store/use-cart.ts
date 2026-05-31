"use client";

import { create } from "zustand";
import { cartItemGrams, gramsPerPack } from "@/lib/product-packs";
import type { CartItem, Product } from "@/types";

function gramsOf(items: CartItem[]) {
  return items.reduce((a, i) => a + cartItemGrams(i), 0);
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
      const packItems = product.isPack ? product.packItems : undefined;
      const item: CartItem = {
        productId: product.id,
        name: product.name,
        category: product.category,
        unit: product.isPack ? "pack" : product.unit,
        pricePerUnit: product.pricePerUnit,
        qty: 1,
        packItems,
        gramsPerPack: product.isPack ? gramsPerPack(packItems) : undefined,
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

export function productFromCartItem(item: CartItem): Product {
  return {
    id: item.productId,
    name: item.name,
    category: item.category,
    sku: "",
    stock: 999,
    unit: item.unit,
    lowStockThreshold: 0,
    pricePerUnit: item.pricePerUnit,
    batch: "",
    expiresAt: null,
    isPack: item.unit === "pack",
    packItems: item.packItems,
  };
}
