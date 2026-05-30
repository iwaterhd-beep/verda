"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  MoreHorizontal,
  Ban,
  Trash2,
  CheckCircle2,
  QrCode,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, PlanBadge } from "@/components/members/status-badge";
import {
  fetchMembers,
  updateMemberStatus,
  deleteMember,
} from "@/lib/data/members";
import { avatarUrl, formatDate } from "@/lib/utils";
import type { Member } from "@/types";

export function MembersTable() {
  const queryClient = useQueryClient();
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    Member["status"] | "ALL"
  >("ALL");

  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
  });

  const rows = members.filter((m) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      m.fullName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.documentId.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["members"] });
  }

  async function handleStatus(m: Member, status: Member["status"], msg: string) {
    try {
      await updateMemberStatus(m.id, status);
      invalidate();
      toast.success(msg, { description: m.fullName });
    } catch (e) {
      toast.error("No se pudo actualizar", { description: (e as Error).message });
    }
  }

  async function handleDelete(m: Member) {
    try {
      await deleteMember(m.id);
      invalidate();
      toast.success("Socio eliminado", { description: m.fullName });
    } catch (e) {
      toast.error("No se pudo eliminar", { description: (e as Error).message });
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, email o documento…"
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as Member["status"] | "ALL")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="ACTIVE">Activos</SelectItem>
            <SelectItem value="PENDING">Pendientes</SelectItem>
            <SelectItem value="EXPIRED">Caducados</SelectItem>
            <SelectItem value="SUSPENDED">Suspendidos</SelectItem>
            <SelectItem value="BLOCKED">Bloqueados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Socio</TableHead>
            <TableHead className="hidden md:table-cell">Documento</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="hidden lg:table-cell">Consumo</TableHead>
            <TableHead className="hidden lg:table-cell">Vence</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <Link href={`/socios/${m.id}`} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={avatarUrl(m.avatarSeed)} />
                    <AvatarFallback>{m.fullName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.email}
                    </p>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="font-mono text-xs text-muted-foreground">
                  {m.documentType} · {m.documentId}
                </span>
              </TableCell>
              <TableCell>
                <PlanBadge plan={m.membershipPlan} />
              </TableCell>
              <TableCell>
                <StatusBadge status={m.status} />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.min(
                          100,
                          (m.consumedThisMonth / m.consumptionLimit) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {m.consumedThisMonth}/{m.consumptionLimit}g
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                {formatDate(m.expiresAt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/socios/${m.id}`}>
                        <QrCode /> Ver ficha
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatus(m, "ACTIVE", "Socio activado")}
                    >
                      <CheckCircle2 /> Activar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleStatus(m, "SUSPENDED", "Socio suspendido")
                      }
                    >
                      <Ban /> Suspender
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(m)}
                    >
                      <Trash2 /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {isLoading && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              </TableCell>
            </TableRow>
          )}
          {error && !isLoading && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={7} className="py-12 text-center text-destructive">
                No se pudieron cargar los socios. ¿Has ejecutado el SQL e iniciado sesión?
              </TableCell>
            </TableRow>
          )}
          {!isLoading && !error && rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                No hay socios todavía. Crea uno o aprueba una solicitud.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
