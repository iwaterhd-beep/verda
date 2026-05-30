"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, Loader2, Leaf, Info } from "lucide-react";
import { useActionState } from "react";
import { signIn, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const params = useSearchParams();
  const isMemberLogin = params.get("rol") === "socio";
  const redirectTo = isMemberLogin
    ? "/portal"
    : params.get("redirect") || "/dashboard";

  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signIn,
    {},
  );

  return (
    <div>
      {isMemberLogin ? (
        <>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Leaf className="h-5 w-5" />
            <span className="text-sm font-medium">Portal de socios</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Entra como socio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Usa el email y la contraseña que te dio el club al aprobar tu alta.
          </p>
          <div className="mt-4 flex gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              Si aún no eres socio,{" "}
              <Link href="/registro-socio" className="text-primary hover:underline">
                solicita tu alta
              </Link>
              . La cuenta de administrador del club no sirve para entrar aquí.
            </p>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">Inicia sesión</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accede al panel de administración de tu club.
          </p>
        </>
      )}

      <form action={formAction} className="mt-8 space-y-4">
        <input type="hidden" name="redirect" value={redirectTo} />
        {isMemberLogin && <input type="hidden" name="rol" value="socio" />}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={isMemberLogin ? "email de tu solicitud" : "tu@email.com"}
              className="pl-9"
              required
            />
          </div>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="pl-9"
              required
            />
          </div>
        </div>

        {state.error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isMemberLogin ? "Entrar al portal" : "Entrar al panel"}
        </Button>
      </form>

      {isMemberLogin ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Eres administrador del club?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Entrar al panel admin
          </Link>
        </p>
      ) : (
        <>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Regístrate
            </Link>
          </p>
          <Link
            href="/login?rol=socio"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/40 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            🌿 Soy socio · acceder a mi portal
          </Link>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            ¿Quieres hacerte socio?{" "}
            <Link href="/registro-socio" className="text-primary hover:underline">
              Solicita tu alta
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
