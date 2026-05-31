"use client";

import QRCode from "react-qr-code";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanBadge, StatusBadge } from "@/components/members/status-badge";
import { formatDate } from "@/lib/utils";
import type { Member } from "@/types";

interface MemberQrCardProps {
  member: Member;
  showDownload?: boolean;
  showActions?: boolean;
  large?: boolean;
}

export function MemberQrCard({
  member,
  showDownload = false,
  showActions = true,
  large = false,
}: MemberQrCardProps) {
  const qrValue = member.qrCode || member.id;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(qrValue);
      toast.success("Código copiado");
    } catch {
      toast.error("No se pudo copiar el código");
    }
  }

  function downloadQr() {
    const svg = document.getElementById("member-qr-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement("a");
      link.download = `carnet-${member.qrCode || "verda"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Carnet descargado");
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  }

  return (
    <Card className="border-glow overflow-hidden">
      <CardContent className="relative p-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent" />
        <div className="relative space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <PlanBadge plan={member.membershipPlan} />
                <StatusBadge status={member.status} />
              </div>
              <p className="mt-3 text-lg font-semibold">{member.fullName}</p>
              <p className="font-mono text-xs text-muted-foreground">{qrValue}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Válido hasta {formatDate(member.expiresAt)}
              </p>
            </div>
            <div
              className={`rounded-xl bg-white p-2 ring-1 ring-border ${
                large ? "p-3" : ""
              }`}
            >
              <div id="member-qr-svg">
                <QRCode
                  value={qrValue}
                  size={large ? 160 : 80}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            </div>
          </div>

          {member.status !== "ACTIVE" && (
            <Badge variant="warning" className="w-full justify-center py-1">
              Tu membresía no está activa. Consulta con el club.
            </Badge>
          )}

          <div className="flex gap-2">
            {showActions && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={copyCode}
                >
                  <Copy className="h-4 w-4" /> Copiar código
                </Button>
                {showDownload && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={downloadQr}
                  >
                    <Download className="h-4 w-4" /> Descargar QR
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
