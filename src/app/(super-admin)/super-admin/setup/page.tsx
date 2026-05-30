"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Loader2, KeyRound } from "lucide-react";
import { useActionState } from "react";
import {
  bootstrapSuperAdminAction,
  checkSuperAdminExistsAction,
  type ActionResult,
} from "@/app/(super-admin)/super-admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SuperAdminSetupPage() {
  const router = useRouter();
  const [checking, setChecking] = React.useState(true);
  const [exists, setExists] = React.useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    bootstrapSuperAdminAction,
    {},
  );

  React.useEffect(() => {
    checkSuperAdminExistsAction().then((has) => {
      setExists(has);
      setChecking(false);
      if (has) router.replace("/super-admin/settings");
    });
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (exists) return null;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Shield className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-semibold">Configurar super admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solo la primera vez. Añade{" "}
          <code className="rounded bg-secondary px-1 text-xs">
            SUPER_ADMIN_BOOTSTRAP_SECRET
          </code>{" "}
          en Vercel → Environment Variables (o en{" "}
          <code className="rounded bg-secondary px-1 text-xs">.env.local</code>{" "}
          en local), elige una clave larga y redeploy.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cuenta de plataforma</CardTitle>
          <CardDescription>
            Si el email ya existe (p. ej. admin de un club), se promueve a super
            admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" placeholder="Tu nombre" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@verda.app"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="secret">Clave de bootstrap</Label>
              <Input
                id="secret"
                name="secret"
                type="password"
                placeholder="Valor de SUPER_ADMIN_BOOTSTRAP_SECRET"
                required
              />
            </div>

            {state.error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Crear super admin
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login?redirect=/super-admin" className="text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
