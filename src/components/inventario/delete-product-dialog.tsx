"use client";

import * as React from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteProductAction } from "@/app/(dashboard)/inventario/actions";
import type { Product } from "@/types";

export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const queryClient = useQueryClient();

  async function confirmDelete() {
    if (!product) return;
    setLoading(true);
    try {
      const res = await deleteProductAction(product.id);
      if (res.error) {
        toast.error("No se pudo eliminar", { description: res.error });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["club-products"] });
      await queryClient.invalidateQueries({ queryKey: ["portal-products"] });
      toast.success("Producto eliminado", { description: product.name });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar producto?</DialogTitle>
          <DialogDescription>
            Se borrará <strong>{product?.name}</strong> del inventario. Esta acción
            no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Trash2 className="h-4 w-4" /> Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
