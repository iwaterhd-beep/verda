import type { Metadata } from "next";
import { Download, Upload } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { MembersTable } from "@/components/members/members-table";
import { CreateMemberDialog } from "@/components/members/create-member-dialog";

export const metadata: Metadata = { title: "Socios" };

export default function SociosPage() {
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Socios"
        description="Gestiona altas, membresías, verificación de edad y renovaciones."
      >
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4" /> Importar
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" /> Exportar
        </Button>
        <CreateMemberDialog />
      </PageHeader>
      <MembersTable />
    </div>
  );
}
