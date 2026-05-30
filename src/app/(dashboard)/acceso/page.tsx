import type { Metadata } from "next";
import { ScanLine, LogIn, LogOut } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { accessLogs } from "@/lib/mock-data";
import { avatarUrl, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Control de acceso" };

export default function AccesoPage() {
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Control de acceso"
        description="Escaneo QR, check-in/out en tiempo real y alertas de bloqueo."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-glow lg:col-span-1">
          <CardHeader>
            <CardTitle>Escáner QR</CardTitle>
            <CardDescription>Apunta el carnet del socio a la cámara</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-secondary/30">
              <div className="absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-primary/60 shadow-glow" />
              <ScanLine className="h-20 w-20 text-primary/70" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <Stat label="Dentro ahora" value="0" />
              <Stat label="Aforo" value="0%" />
              <Stat label="Hoy" value="0" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registro de entradas y salidas</CardTitle>
            <CardDescription>Hoy · {formatDate(new Date())}</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Socio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="hidden sm:table-cell">Acceso</TableHead>
                  <TableHead>Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No hay registros de acceso hoy.
                    </TableCell>
                  </TableRow>
                ) : (
                  accessLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={avatarUrl(log.memberName)} />
                            <AvatarFallback>
                              {log.memberName.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {log.memberName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.type === "CHECK_IN" ? (
                          <Badge variant="success">
                            <LogIn className="h-3 w-3" /> Entrada
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <LogOut className="h-3 w-3" /> Salida
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.method}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {log.location}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 py-3">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
