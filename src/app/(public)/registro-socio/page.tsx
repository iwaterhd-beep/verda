"use client";

import * as React from "react";
import Link from "next/link";
import {
  User,
  MapPin,
  IdCard,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhotoUpload } from "@/components/applications/photo-upload";
import { submitApplication } from "@/lib/data/applications";

function ageFrom(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 864e5));
}

export default function RegistroSocioPage() {
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const [facePhoto, setFacePhoto] = React.useState<string | null>(null);
  const [dniFront, setDniFront] = React.useState<string | null>(null);
  const [dniBack, setDniBack] = React.useState<string | null>(null);
  const [consent, setConsent] = React.useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const fullName = String(f.get("fullName") || "").trim();
    const documentId = String(f.get("documentId") || "").trim();
    const birthDate = String(f.get("birthDate") || "");
    const locality = String(f.get("locality") || "").trim();
    const address = String(f.get("address") || "").trim();
    const phone = String(f.get("phone") || "").trim();
    const email = String(f.get("email") || "").trim();

    if (!fullName || !documentId || !birthDate || !locality || !address || !phone || !email) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    if (ageFrom(birthDate) < 18) {
      toast.error("Debes ser mayor de edad para solicitar el alta");
      return;
    }
    if (!facePhoto || !dniFront || !dniBack) {
      toast.error("Adjunta tu foto y ambas caras del DNI");
      return;
    }
    if (!consent) {
      toast.error("Debes aceptar la política de privacidad (RGPD)");
      return;
    }

    setLoading(true);
    submitApplication({
      fullName,
      documentId,
      birthDate,
      locality,
      address,
      phone,
      email,
      facePhoto,
      dniFront,
      dniBack,
    })
      .then(() => setDone(true))
      .catch((err) => {
        toast.error("No se pudo enviar la solicitud", {
          description:
            err?.message ??
            "Comprueba la conexión con Supabase (ejecuta supabase/schema.sql).",
        });
      })
      .finally(() => setLoading(false));
  }

  if (done) {
    return (
      <Card className="border-glow mt-6 text-center">
        <CardContent className="flex flex-col items-center p-8">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-xl font-semibold">¡Solicitud enviada!</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Tu solicitud de alta está <strong>pendiente de revisión</strong>. El
            club verificará tus datos y te avisará por email.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-2">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Solicitud de alta de socio
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rellena tus datos. La membresía requiere aprobación del club.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Datos personales */}
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="fullName">Nombre completo *</Label>
              <Input id="fullName" name="fullName" placeholder="Nombre y apellidos" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="documentId">DNI / NIE *</Label>
              <Input id="documentId" name="documentId" placeholder="12345678A" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
              <Input id="birthDate" name="birthDate" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input id="phone" name="phone" placeholder="+34 600 000 000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" placeholder="tu@email.com" />
            </div>
          </CardContent>
        </Card>

        {/* Domicilio */}
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Domicilio</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="locality">Localidad *</Label>
              <Input id="locality" name="locality" placeholder="Barcelona" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Dirección *</Label>
              <Input id="address" name="address" placeholder="Calle, número, piso" />
            </div>
          </CardContent>
        </Card>

        {/* Documentación */}
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <IdCard className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Documentación</CardTitle>
            <CardDescription className="sr-only">Fotos requeridas</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <PhotoUpload
              label="Foto de tu cara"
              value={facePhoto}
              onChange={setFacePhoto}
              capture="user"
            />
            <PhotoUpload
              label="DNI · anverso"
              value={dniFront}
              onChange={setDniFront}
              capture="environment"
            />
            <PhotoUpload
              label="DNI · reverso"
              value={dniBack}
              onChange={setDniBack}
              capture="environment"
            />
          </CardContent>
        </Card>

        {/* Consentimiento */}
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-4">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
          />
          <span className="text-sm text-muted-foreground">
            He leído y acepto la{" "}
            <Link href="/legal" className="text-primary hover:underline">
              política de privacidad
            </Link>{" "}
            y consiento el tratamiento de mis datos conforme al RGPD.
          </span>
        </label>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar solicitud
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Tus datos se cifran y solo los ve
          el club.
        </p>
      </form>
    </div>
  );
}
