"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, AlertTriangle, Loader2 } from "lucide-react";
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
import { ensureClubCatalogAction } from "@/app/(dashboard)/inventario/actions";
import { formatCurrency, formatDate } from "@/lib/utils";

const categoryLabels: Record<string, string> = {
  FLOR: "Flor",
  EXTRACTO: "Extracto",
  COMESTIBLE: "Comestible",
  MERCH: "Merch",
  OTRO: "Otro",
};

export function InventarioClient() {
  const queryClient = useQueryClient();
  const [initDone, setInitDone] = React.useState(false);

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["club-products"],
    queryFn: async () => {
      if (!initDone) {
        await ensureClubCatalogAction();
        setInitDone(true);
      }
      return fetchClubProducts();
    },
  });

  React.useEffect(() => {
    const onFocus = () =>
      queryClient.invalidateQueries({ queryKey: ["club-products"] });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [queryClient]);

  const lowStock = products.filter((p) => p.stock < p.lowStockThreshold);

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Inventario"
        description="Stock real del club. Se actualiza al marcar pedidos como listos."
      >
        <Button size="sm">
          <Plus className="h-4 w-4" /> Nuevo producto
        </Button>
      </PageHeader>

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
                  <TableHead className="hidden md:table-cell">Lote</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="hidden lg:table-cell">Caducidad</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const low = p.stock < p.lowStockThreshold;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="pl-6">
                        <p className="font-medium">{p.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {p.sku}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[p.category]}
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
                            {p.unit === "g" ? p.stock.toFixed(2) : p.stock}{" "}
                            {p.unit}
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
                        {formatCurrency(p.pricePerUnit)}/{p.unit}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
