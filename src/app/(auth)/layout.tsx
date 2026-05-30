import Link from "next/link";
import { Quote, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border/60 p-10 lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-verda-mesh opacity-80" />
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-10" />
        <Link href="/" className="relative">
          <Logo />
        </Link>
        <div className="relative max-w-md">
          <Quote className="h-8 w-8 text-primary/60" />
          <p className="mt-4 text-2xl font-medium leading-snug">
            Verda nos ahorró horas cada semana. El alta de socios y el control de
            acceso son ahora instantáneos.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            — María L., directora de Club Verde
          </p>
        </div>
        <div className="relative flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Cumple RGPD · Datos cifrados · 2FA disponible
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
