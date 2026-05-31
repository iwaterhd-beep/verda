"use client";

import { useQuery } from "@tanstack/react-query";
import { currentMember } from "@/lib/current-member";
import { fetchMyMember } from "@/lib/data/members";
import { ProfileSubpage } from "@/components/portal/profile-subpage";
import { MemberQrCard } from "@/components/portal/member-qr-card";
import { Card, CardContent } from "@/components/ui/card";

export default function CarnetPage() {
  const { data } = useQuery({ queryKey: ["my-member"], queryFn: fetchMyMember });
  const member = data ?? currentMember;

  return (
    <ProfileSubpage
      title="Mi carnet digital"
      description="Preséntalo en recepción para acceder al club o recoger pedidos."
    >
      <MemberQrCard member={member} showDownload large />

      <Card>
        <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
          <p>
            Muestra este código QR en la entrada del club. El personal lo escaneará
            para validar tu membresía.
          </p>
          <p>
            También puedes usarlo al recoger un pedido preparado en mostrador.
          </p>
        </CardContent>
      </Card>
    </ProfileSubpage>
  );
}
