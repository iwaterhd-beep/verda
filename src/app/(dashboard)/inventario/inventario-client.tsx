"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, AlertTriangle, Loader2, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchClubProducts } from "@/lib/data/products";
import { CreateProductDialog } from "@/components/inventario/create-product-dialog";
import { ManageCategoriesDialog } from "@/components/inventario/manage-categories-dialog";
import { ManageFarmsDialog } from "@/components/inventario/manage-farms-dialog";
import {
  EditProductDialog,
} from "@/components/inventario/product-form-dialog";
import { DeleteProductDialog } from "@/components/inventario/delete-product-dialog";
import { toggleProductHiddenAction } from "@/app/(dashboard)/inventario/actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ProductPrice, hasProductOffer } from "@/lib/product-price";
import { getCategoryDisplay, categoryBadgeStyle } from "@/lib/product-meta";
import { productMediaThumb } from "@/components/portal/product-media-gallery";
import { fetchClubCategories } from "@/lib/data/product-categories";
import type { Product } from "@/types";

export function InventarioClient() {
  const queryClient = useQueryClient();
  const [editProduct, setEditProduct] = React.useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = React.useState<Product | null>(null);
  const [togglingHiddenId, setTogglingHiddenId] = React.useState<string | null>(null);

  async function toggleHidden(product: Product) {
    setTogglingHiddenId(product.id);
    const next = !product.hiddenFromMembers;
    const res = await toggleProductHiddenAction(product.id, next);
    setTogglingHiddenId(null);
    if (res.error) {
      toast.error("No se pudo actualizar", { description: res.error });
      return;
    }
    toast.success(next ? "Producto oculto para socios" : "Producto visible en el portal");
    void queryClient.invalidateQueries({ queryKey: ["club-products"] });
    void queryClient.invalidateQueries({ queryKey: ["portal-products"] });
  }

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["club-products"],
    queryFn: fetchClubProducts,
  });

  React.useEffect(() => {
    const onFocus = () =>
      queryClient.invalidateQueries({ queryKey: ["club-products"] });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [queryClient]);

  const { data: categories = [] } = useQuery({
    queryKey: ["club-categories"],
    queryFn: fetchClubCategories,
  });

  const lowStock = products.filter((p) => p.stock < p.lowStockThreshold);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Inventario"
        description="Stock real del club. Se actualiza al marcar pedidos como listos."
      >
        <ManageCategoriesDialog />
        <ManageFarmsDialog />
        <CreateProductDialog />
      </PageHeader>

      {editProduct && (
        <EditProductDialog
          product={editProduct}
          open={Boolean(editProduct)}
          onOpenChange={(open) => !open && setEditProduct(null)}
        />
      )}

      <DeleteProductDialog
        product={deleteProduct}
        open={Boolean(deleteProduct)}
        onOpenChange={(open) => !open && setDeleteProduct(null)}
      />

      {isLoading ? (
        <Card>
          <CardContent className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/30">
          <CardContent className="py-10 text-center text-sm text-destructive">
            No se pudo cargar el inventario. ¿Has ejecutado el SQL de products?
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniStat icon={Package} label="Referencias" value={String(products.length)} />
            <MiniStat
              icon={Package}
              label="Unidades totales"
              value={String(
                Math.round(products.reduce((a, p) => a + p.stock, 0) * 100) / 100,
              )}
            />
            <MiniStat
              icon={AlertTriangle}
              label="Stock bajo"
              value={String(lowStock.length)}
              warning
            />
            <MiniStat
              icon={Package}
              label="Valor inventario"
              value={formatCurrency(
                products.reduce((a, p) => a + p.stock * p.pricePerUnit, 0),
              )}
            />
          </div>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="hidden sm:table-cell">Venta</TableHead>
                  <TableHead className="hidden md:table-cell">Lote</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="hidden lg:table-cell">Caducidad</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="w-[132px] pr-6 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      No hay productos. Crea el primero con &quot;Nuevo producto&quot;.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => {
                    const low = p.stock < p.lowStockThreshold;
                    const thumb = productMediaThumb(p);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
                              {thumb.type === "video" && thumb.url ? (
                                <video
                                  src={thumb.url}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  className="h-full w-full object-cover"
                                />
                              ) : thumb.type === "photo" && thumb.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={thumb.url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{p.name}</p>
                                {p.isPack && (
                                  <Badge variant="outline" className="h-5 text-[10px]">
                                    Pack
                                  </Badge>
                                )}
                                {p.hiddenFromMembers && (
                                  <Badge variant="secondary" className="h-5 text-[10px]">
                                    Oculto
                                  </Badge>
                                )}
                              </div>
                              <p className="font-mono text-xs text-muted-foreground">
                                {p.sku}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={categoryBadgeStyle(
                              getCategoryDisplay(p.category, categories).color,
                            )}
                          >
                            {getCategoryDisplay(p.category, categories).formLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className="font-normal">
                            {p.isPack
                              ? "Pack"
                              : p.unit === "g"
                                ? "Gramos"
                                : "Unidades"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                          {p.batch}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                low
                                  ? "font-semibold text-[hsl(var(--warning))]"
                                  : "font-medium"
                              }
                            >
                              {p.isPack
                                ? `${p.stock} packs`
                                : `${p.unit === "g" ? p.stock.toFixed(2) : p.stock} ${p.unit}`}
                            </span>
                            {low && (
                              <Badge variant="warning" className="h-5">
                                <AlertTriangle className="h-3 w-3" /> Bajo
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                          {p.expiresAt ? formatDate(p.expiresAt) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {hasProductOffer(p) ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <ProductPrice product={p} size="md" />
                              <Badge variant="outline" className="h-5 text-[10px]">
                                Oferta
                              </Badge>
                            </div>
                          ) : p.isPack ? (
                            formatCurrency(p.pricePerUnit)
                          ) : (
                            `${formatCurrency(p.pricePerUnit)}/${p.unit}`
                          )}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={togglingHiddenId === p.id}
                              title={
                                p.hiddenFromMembers
                                  ? "Mostrar a socios"
                                  : "Ocultar a socios"
                              }
                              onClick={() => void toggleHidden(p)}
                            >
                              {togglingHiddenId === p.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : p.hiddenFromMembers ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditProduct(p)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteProduct(p)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  warning,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl ${
            warning
              ? "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]"
              : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-lg font-semibold leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
