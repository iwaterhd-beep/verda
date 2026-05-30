"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Loader2, PackageCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchClubOrders } from "@/lib/data/orders";
import { formatCurrency, formatDate } from "@/lib/utils";

export function RecentOrdersCard() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["club-orders"],
    queryFn: fetchClubOrders,
    refetchInterval: 20_000,
  });

  const recent = orders.slice(0, 5);
  const preparing = orders.filter((o) => o.status === "PREPARING").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Pedidos del portal</CardTitle>
          <CardDescription>
            {preparing > 0
              ? `${preparing} en preparación`
              : "Pedidos online de socios"}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/pedidos">Ver todos</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center text-sm text-muted-foreground">
            <ClipboardList className="mb-2 h-8 w-8 opacity-40" />
            Sin pedidos todavía
          </div>
        ) : (
          recent.map((o) => (
            <Link
              key={o.id}
              href="/pedidos"
              className="flex items-center justify-between rounded-xl border border-border/60 p-3 transition-colors hover:bg-secondary/40"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm font-medium">{o.code}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {o.memberName} · {formatDate(o.createdAt, true)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold">
                  {formatCurrency(o.total)}
                </span>
                {o.status === "PREPARING" && (
                  <Badge variant="warning">Preparando</Badge>
                )}
                {o.status === "READY" && (
                  <Badge variant="success">
                    <PackageCheck className="h-3 w-3" /> Listo
                  </Badge>
                )}
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
