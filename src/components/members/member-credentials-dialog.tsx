"use client";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface MemberCredentials {
  name: string;
  email: string;
  password: string;
}

export function MemberCredentialsDialog({
  credentials,
  open,
  onOpenChange,
}: {
  credentials: MemberCredentials | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Socio dado de alta</DialogTitle>
          <DialogDescription>
            Comparte estas credenciales con {credentials?.name}. Podrá entrar en
            el portal de socios y cambiar su contraseña.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Email</span>
            <span className="font-mono">{credentials?.email}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Contraseña temporal</span>
            <span className="font-mono">{credentials?.password}</span>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (!credentials) return;
              navigator.clipboard
                .writeText(
                  `Acceso al portal de socios\nEmail: ${credentials.email}\nContraseña: ${credentials.password}\n${window.location.origin}/login`,
                )
                .then(() => toast.success("Credenciales copiadas"));
            }}
          >
            Copiar
          </Button>
          <Button onClick={() => onOpenChange(false)}>Hecho</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
