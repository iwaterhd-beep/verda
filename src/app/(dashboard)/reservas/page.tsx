import type { Metadata } from "next";
import { Plus, Clock, Users, MapPin } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { reservations } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Reservas" };

const statusMap = {
  CONFIRMED: { label: "Confirmada", variant: "success" as const },
  PENDING: { label: "Pendiente", variant: "warning" as const },
  CANCELLED: { label: "Cancelada", variant: "destructive" as const },
};

const spaces = ["Sala Lounge", "Terraza", "Sala Gaming", "Sala Privada"];

export default function ReservasPage() {
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Reservas"
        description="Reservas online, calendario y gestión de salas y espacios."
      >
        <Button size="sm">
          <Plus className="h-4 w-4" /> Nueva reserva
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {reservations.map((r) => {
            const s = statusMap[r.status];
            return (
              <Card key={r.id}>
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-center">
                    <span className="text-xs uppercase text-primary">
                      {new Date(r.date).toLocaleDateString("es-ES", {
                        month: "short",
                      })}
                    </span>
                    <span className="text-lg font-semibold leading-none text-primary">
                      {new Date(r.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{r.memberName}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {r.space}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {r.startTime}–{r.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {r.guests} personas
                      </span>
                    </div>
                  </div>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Espacios</CardTitle>
            <CardDescription>Disponibilidad de hoy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {spaces.map((space, i) => (
              <div
                key={space}
                className="flex items-center justify-between rounded-xl border border-border/60 p-3"
              >
                <span className="text-sm font-medium">{space}</span>
                <Badge variant={i % 3 === 0 ? "warning" : "success"}>
                  {i % 3 === 0 ? "Casi lleno" : "Disponible"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
