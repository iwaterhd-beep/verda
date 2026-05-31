"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  PenLine,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
} from "lucide-react";
import { currentMember } from "@/lib/current-member";
import { fetchMyMember } from "@/lib/data/members";
import { fetchMyApplication } from "@/lib/data/applications";
import { ProfileSubpage } from "@/components/portal/profile-subpage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { ProtectedImage } from "@/components/portal/protected-media";

const CONSENT_TEXT = `Consentimiento para el tratamiento de datos personales

Autorizo al club a tratar mis datos identificativos, de contacto e imagen con la finalidad de gestionar mi condición de socio, control de acceso, cumplimiento legal y comunicaciones relacionadas con la asociación.

Puedo ejercer mis derechos de acceso, rectificación, supresión, limitación, oposición y portabilidad contactando con el club.`;

const CLUB_RULES_TEXT = `Reglamento interno del club

Me comprometo a respetar las normas de convivencia, consumo responsable, horarios de acceso y prohibición de reventa. El incumplimiento puede suponer la suspensión de la membresía.`;

export default function DocumentosPage() {
  const { data: memberData } = useQuery({
    queryKey: ["my-member"],
    queryFn: fetchMyMember,
  });
  const { data: application } = useQuery({
    queryKey: ["my-application"],
    queryFn: fetchMyApplication,
  });
  const member = memberData ?? currentMember;
  const [viewDoc, setViewDoc] = React.useState<{
    title: string;
    body: string;
  } | null>(null);
  const [viewImage, setViewImage] = React.useState<{
    title: string;
    url: string;
  } | null>(null);

  const signed = member.status === "ACTIVE";

  const consents = [
    {
      id: "rgpd",
      title: "Consentimiento RGPD",
      signed,
      date: member.joinedAt,
      body: CONSENT_TEXT,
    },
    {
      id: "rules",
      title: "Reglamento interno",
      signed,
      date: member.joinedAt,
      body: CLUB_RULES_TEXT,
    },
    {
      id: "contract",
      title: "Contrato de socio",
      signed: member.signatureSigned,
      date: member.joinedAt,
      body: "Contrato de adhesión como socio de la asociación cannábica, aceptando estatutos y cuotas vigentes.",
    },
  ];

  const uploads = [
    application?.facePhoto && {
      id: "face",
      title: "Foto de perfil (alta)",
      url: application.facePhoto,
    },
    application?.dniFront && {
      id: "dni-front",
      title: "DNI — anverso",
      url: application.dniFront,
    },
    application?.dniBack && {
      id: "dni-back",
      title: "DNI — reverso",
      url: application.dniBack,
    },
  ].filter(Boolean) as { id: string; title: string; url: string }[];

  return (
    <ProfileSubpage
      title="Documentos y consentimientos"
      description="Estado de tus firmas y archivos asociados a tu ficha."
    >
      <div className="space-y-3">
        <p className="text-sm font-medium">Consentimientos</p>
        {consents.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="flex items-center gap-3 p-4">
              {doc.signed ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{doc.title}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.signed
                    ? `Firmado · ${formatDate(doc.date)}`
                    : "Pendiente de firma"}
                </p>
              </div>
              <Badge variant={doc.signed ? "success" : "secondary"}>
                {doc.signed ? "Firmado" : "Pendiente"}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setViewDoc({ title: doc.title, body: doc.body })
                }
              >
                Ver
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Documentos subidos</p>
        {uploads.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              No hay documentos visibles en tu ficha. Si te diste de alta online,
              el club los revisará en tu solicitud.
            </CardContent>
          </Card>
        ) : (
          uploads.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <span className="flex-1 text-sm font-medium">{doc.title}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setViewImage({ title: doc.title, url: doc.url })}
                >
                  <Eye className="h-4 w-4" /> Ver
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Para solicitar una copia actualizada o modificar un consentimiento,
            contacta con la administración del club.
          </p>
        </CardContent>
      </Card>

      <Dialog open={Boolean(viewImage)} onOpenChange={() => setViewImage(null)}>
        <DialogContent className="portal-dialog max-w-sm gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border/50 px-4 py-3 text-left">
            <DialogTitle>{viewImage?.title}</DialogTitle>
          </DialogHeader>
          <div className="aspect-[4/5] w-full bg-secondary">
            {viewImage?.url && (
              <ProtectedImage src={viewImage.url} alt={viewImage.title} />
            )}
          </div>
          <p className="px-4 py-3 text-xs text-muted-foreground">
            Contenido protegido. No está permitido descargar, copiar ni capturar
            estos documentos.
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewDoc)} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              {viewDoc?.title}
            </DialogTitle>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {viewDoc?.body}
          </p>
        </DialogContent>
      </Dialog>
    </ProfileSubpage>
  );
}
