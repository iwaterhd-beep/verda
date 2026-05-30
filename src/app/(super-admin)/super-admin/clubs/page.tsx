"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchPlatformClubsAction } from "@/app/(super-admin)/super-admin/actions";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SuperAdminClubsPage() {
  const [q, setQ] = React.useState("");

  const { data: clubs = [], isLoading, error } = useQuery({
    queryKey: ["platform-clubs"],
    queryFn: async () => {
      const res = await fetchPlatformClubsAction();
      if ("error" in res) throw new Error(res.error);
      return res;
    },
  });

  const filtered = clubs.filter((c) => {
    const hay = `${c.name} ${c.city ?? ""} ${c.adminEmail ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Clubs"
        description={`${clubs.length} clubs registrados en la plataforma`}
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar club, ciudad o admin…"
          className="pl-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <Building2 className="mb-2 h-10 w-10 opacity-40" />
          <p className="text-sm">No hay clubs que coincidan</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Club</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Socios</TableHead>
                <TableHead>Pedidos</TableHead>
                <TableHead>Ingresos</TableHead>
                <TableHead>Alta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((club) => (
                <TableRow key={club.id} className="cursor-pointer hover:bg-secondary/30">
                  <TableCell>
                    <Link
                      href={`/super-admin/clubs/${club.id}`}
                      className="font-medium hover:underline"
                    >
                      {club.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {club.city ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{club.adminName ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {club.adminEmail ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{club.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    {club.activeMemberCount}
                    <span className="text-muted-foreground">
                      {" "}
                      / {club.memberCount}
                    </span>
                  </TableCell>
                  <TableCell>{club.orderCount}</TableCell>
                  <TableCell>{formatCurrency(club.revenueTotal)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(club.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
