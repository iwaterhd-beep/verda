"use client";

import Link from "next/link";
import { Loader2, Check, MailCheck } from "lucide-react";
import { useActionState } from "react";
import { signUp, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUp,
    {},
  );

  if (state.message) {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Confirma tu email
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
        <Button className="mt-6 w-full" asChild>
          <Link href="/login">Ir a iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Crea tu cuenta</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Empieza gratis. Sin tarjeta de crédito.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="club">Nombre del club</Label>
          <Input id="club" name="club" placeholder="Club Verde" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="name">Tu nombre</Label>
          <Input id="name" name="name" placeholder="Nombre y apellidos" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            required
          />
        </div>

        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {["Cumple RGPD desde el día uno", "Datos cifrados AES-256", "2FA disponible"].map(
            (t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary" /> {t}
              </li>
            ),
          )}
        </ul>

        {state.error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear cuenta gratis
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
