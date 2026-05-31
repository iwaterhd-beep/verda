"use client";

import { useQuery } from "@tanstack/react-query";
import { Database, Download, Mail, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { currentMember } from "@/lib/current-member";
import { fetchMyMember } from "@/lib/data/members";
import { fetchMyOrders } from "@/lib/data/orders";
import { ProfileSubpage } from "@/components/portal/profile-subpage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PrivacidadPage() {
  const { data: member } = useQuery({
    queryKey: ["my-member"],
    queryFn: fetchMyMember,
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders"],
    queryFn: fetchMyOrders,
  });
  const m = member ?? currentMember;

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      member: {
        fullName: m.fullName,
        email: m.email,
        phone: m.phone,
        documentType: m.documentType,
        documentId: m.documentId,
        status: m.status,
        plan: m.membershipPlan,
        joinedAt: m.joinedAt,
        expiresAt: m.expiresAt,
        walletBalance: m.walletBalance,
        consumptionLimit: m.consumptionLimit,
        consumedThisMonth: m.consumedThisMonth,
      },
      orders: orders.map((o) => ({
        code: o.code,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
        items: o.items.map((i) => ({
          name: i.name,
          qty: i.qty,
          unit: i.unit,
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `verda-datos-${m.fullName.replace(/\s+/g, "-").toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Datos exportados");
  }

  return (
    <ProfileSubpage
      title="Privacidad y RGPD"
      description="Tus derechos sobre datos personales."
    >
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              Verda trata tus datos para gestionar tu membresía, accesos, pedidos y
              cumplimiento legal. Solo el personal autorizado de tu club puede
              consultarlos.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <ActionButton
          icon={Download}
          label="Exportar mis datos"
          description="Descarga un JSON con tu ficha y pedidos"
          onClick={exportData}
        />
        <ActionButton
          icon={Database}
          label="Acceso y rectificación"
          description="Contacta con el club para corregir tus datos"
          onClick={() =>
            toast.message("Escríbenos", {
              description: `Contacta al club en ${m.email || "recepción"} para actualizar tu ficha.`,
            })
          }
        />
        <ActionButton
          icon={Trash2}
          label="Supresión / baja"
          description="Solicita la baja y eliminación de tus datos"
          onClick={() =>
            toast.message("Solicitud de baja", {
              description:
                "Pasa por recepción o escribe al club para tramitar la baja conforme al RGPD.",
            })
          }
        />
        <ActionButton
          icon={Mail}
          label="Delegado de protección de datos"
          description="privacidad@verda.app (ejemplo)"
          onClick={() => {
            window.location.href = "mailto:privacidad@verda.app?subject=Consulta RGPD";
          }}
        />
      </div>

      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground">
          Base legal: ejecución del contrato de socio y obligaciones legales.
          Conservación: mientras dure la relación y plazos legales aplicables.
          Puedes presentar reclamación ante la AEPD.
        </CardContent>
      </Card>
    </ProfileSubpage>
  );
}

function ActionButton({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-auto w-full justify-start gap-3 px-4 py-3"
      onClick={onClick}
    >
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="text-left">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs font-normal text-muted-foreground">
          {description}
        </span>
      </span>
    </Button>
  );
}
