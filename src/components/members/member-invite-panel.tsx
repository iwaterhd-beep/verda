"use client";

import * as React from "react";
import { Copy, Check, Link2, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { getMemberInviteLinkAction } from "@/app/(dashboard)/socios/invite-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MemberInvitePanel() {
  const [url, setUrl] = React.useState("");
  const [clubName, setClubName] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    getMemberInviteLinkAction().then((res) => {
      if (res.error) {
        toast.error("No se pudo generar el enlace", { description: res.error });
      } else if (res.url) {
        setUrl(res.url);
        setClubName(res.clubName ?? "Tu club");
      }
      setLoading(false);
    });
  }, []);

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Enlace copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar. Selecciona el enlace manualmente.");
    }
  }

  async function shareLink() {
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Alta de socio · ${clubName}`,
          text: `Solicita tu alta como socio de ${clubName}:`,
          url,
        });
        return;
      } catch {
        /* usuario canceló */
      }
    }
    await copyLink();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <Link2 className="h-4 w-4 text-primary" />
          Enlace de alta para {clubName}
        </p>
        <p className="mt-2">
          Comparte este enlace con tus socios. Ellos rellenan la solicitud y tú
          la apruebas en <strong>Solicitudes</strong>.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="invite-url">Enlace de invitación</Label>
        <Input id="invite-url" readOnly value={url} className="font-mono text-xs" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={copyLink} disabled={!url}>
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copiado" : "Copiar enlace"}
        </Button>
        <Button type="button" variant="outline" onClick={shareLink} disabled={!url}>
          <Share2 className="h-4 w-4" /> Compartir
        </Button>
      </div>
    </div>
  );
}
