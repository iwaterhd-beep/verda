"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
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
import { fetchPlatformUsersAction } from "@/app/(super-admin)/super-admin/actions";
import { formatDate } from "@/lib/utils";
import type { Role } from "@/types";

const roleLabel: Record<Role, string> = {
  SUPER_ADMIN: "Super admin",
  CLUB_ADMIN: "Admin club",
  EMPLOYEE: "Empleado",
  MEMBER: "Socio",
};

const roleVariant: Record<
  Role,
  "default" | "secondary" | "success" | "destructive"
> = {
  SUPER_ADMIN: "default",
  CLUB_ADMIN: "success",
  EMPLOYEE: "secondary",
  MEMBER: "secondary",
};

export default function SuperAdminUsersPage() {
  const [q, setQ] = React.useState("");

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["platform-users"],
    queryFn: async () => {
      const res = await fetchPlatformUsersAction();
      if ("error" in res) throw new Error(res.error);
      return res;
    },
  });

  const filtered = users.filter((u) => {
    const hay = `${u.name ?? ""} ${u.email ?? ""} ${u.clubName ?? ""} ${u.role}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Usuarios"
        description="Cuentas de plataforma, admins de club y socios con acceso"
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar nombre, email o club…"
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
      ) : (
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Alta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-medium">{user.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{user.email ?? "—"}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleVariant[user.role]}>
                      {roleLabel[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.clubName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
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
