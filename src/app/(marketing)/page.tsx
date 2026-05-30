import Link from "next/link";
import {
  ArrowRight,
  Users,
  ScanLine,
  Boxes,
  ShoppingCart,
  CalendarDays,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Check,
  Zap,
  Lock,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/marketing/reveal";
import { Logo } from "@/components/brand/logo";

const features = [
  { icon: Users, title: "Socios sin fricción", desc: "Alta con DNI/NIE, foto, firma digital, QR único y verificación de edad en segundos." },
  { icon: ScanLine, title: "Control de acceso QR", desc: "Check-in/out en tiempo real, aforo, historial y bloqueos automáticos." },
  { icon: Boxes, title: "Inventario inteligente", desc: "Lotes, caducidad, movimientos y alertas automáticas de stock bajo." },
  { icon: ShoppingCart, title: "TPV ultrarrápido", desc: "Ventas en segundos, monedero del socio, tickets y estadísticas." },
  { icon: CalendarDays, title: "Reservas", desc: "Reserva online de salas y espacios con confirmaciones automáticas." },
  { icon: ShieldCheck, title: "Cumplimiento RGPD", desc: "Consentimientos, auditoría inmutable y exportación de datos." },
];

const modules = [
  "Registro de socios", "Membresías", "Control de acceso", "Inventario",
  "TPV", "Reservas", "Comunicación", "Legal y RGPD", "Multi-club", "Analytics",
];

const plans = [
  {
    name: "Starter",
    price: "0 Crd",
    period: "/mes",
    desc: "Para clubes que empiezan.",
    features: ["Hasta 50 socios", "Control de acceso QR", "TPV básico", "1 club"],
    cta: "Empezar gratis",
    highlight: false,
  },
  {
    name: "Pro",
    price: "79 Crd",
    period: "/mes",
    desc: "El favorito de los clubes en crecimiento.",
    features: ["Socios ilimitados", "Inventario + lotes", "Reservas y comunicación", "Analytics avanzado", "Automatizaciones"],
    cta: "Probar 14 días",
    highlight: true,
  },
  {
    name: "Multi-club",
    price: "A medida",
    period: "",
    desc: "Para redes de asociaciones.",
    features: ["Clubes ilimitados", "Roles y permisos (RBAC)", "Verda AI", "API y SSO", "Soporte prioritario"],
    cta: "Hablar con ventas",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="relative px-4 pt-36 pb-24">
        <div className="pointer-events-none absolute inset-0 bg-verda-mesh opacity-70" />
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-[0.15]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <Badge variant="outline" className="mb-6 gap-1.5 border-primary/30 bg-primary/5 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Ahora con Verda AI — automatiza tu club
            </Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              El sistema operativo para{" "}
              <span className="text-gradient-green">clubes cannábicos</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
              Gestiona socios, accesos, inventario, TPV, reservas y cumplimiento
              legal desde una plataforma premium, segura y lista para escalar a
              múltiples clubes.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/register">
                  Empezar gratis <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="glass" asChild>
                <Link href="/dashboard">Ver demo del panel</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-xs text-muted-foreground">
              Sin tarjeta · Cumple RGPD · Datos cifrados AES-256
            </p>
          </Reveal>
        </div>

        {/* Dashboard preview */}
        <Reveal delay={0.25} className="relative mx-auto mt-16 max-w-5xl">
          <div className="border-glow overflow-hidden rounded-2xl border border-white/10 bg-card/60 shadow-glow backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-destructive/70" />
              <span className="h-3 w-3 rounded-full bg-[hsl(var(--warning))]" />
              <span className="h-3 w-3 rounded-full bg-[hsl(var(--success))]" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">
                clubverde.verda.app/dashboard
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3 p-5 sm:grid-cols-4">
              {[
                { k: "Socios activos", v: "128", d: "+12%" },
                { k: "Ingresos", v: "31.200 Crd", d: "+8%" },
                { k: "Visitas hoy", v: "47", d: "58%" },
                { k: "Ticket medio", v: "27,40 Crd", d: "+6%" },
              ].map((s) => (
                <div key={s.k} className="rounded-xl border border-white/10 bg-background/40 p-3 text-left">
                  <p className="text-[0.7rem] text-muted-foreground">{s.k}</p>
                  <p className="mt-1 text-lg font-semibold">{s.v}</p>
                  <p className="text-xs text-primary">{s.d}</p>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5">
              <div className="flex h-40 items-end gap-1.5 rounded-xl border border-white/10 bg-background/40 p-4">
                {[40, 55, 48, 70, 62, 85, 78, 95, 88, 100, 92, 110].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-primary/30 to-primary"
                    style={{ height: `${h * 0.7}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border/60 bg-card/20 py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Tiempo de alta &lt; 60s</span>
          <span className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Cifrado AES-256</span>
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> RGPD & LOPDGDD</span>
          <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Analytics en tiempo real</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Todo lo que tu club necesita, en un solo lugar
          </h2>
          <p className="mt-4 text-muted-foreground">
            Sustituye hojas de cálculo y herramientas dispersas por una plataforma
            unificada, rápida y elegante.
          </p>
        </Reveal>
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <div className="group h-full rounded-2xl border border-border bg-card/40 p-6 transition-all hover:border-primary/30 hover:bg-card/70">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="border-y border-border/60 bg-card/20 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <Reveal>
            <Badge variant="default" className="mb-4">10 módulos integrados</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">
              Una plataforma modular y escalable
            </h2>
          </Reveal>
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {modules.map((m, i) => (
              <Reveal key={m} delay={i * 0.03}>
                <span className="rounded-full border border-border bg-background/60 px-4 py-2 text-sm">
                  {m}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Precios simples y transparentes
          </h2>
          <p className="mt-4 text-muted-foreground">
            Empieza gratis. Escala cuando crezcas.
          </p>
        </Reveal>
        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.07}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-6 ${
                  p.highlight
                    ? "border-primary/40 bg-card shadow-glow"
                    : "border-border bg-card/40"
                }`}
              >
                {p.highlight && (
                  <Badge className="absolute -top-3 left-6">Más popular</Badge>
                )}
                <h3 className="font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-3xl font-semibold">{p.price}</span>
                  <span className="pb-1 text-sm text-muted-foreground">{p.period}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={p.highlight ? "default" : "outline"}
                  asChild
                >
                  <Link href="/register">{p.cta}</Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24">
        <Reveal className="mx-auto max-w-4xl">
          <div className="border-glow relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute inset-0 bg-grid-glow" />
            <h2 className="relative text-3xl font-semibold tracking-tight sm:text-4xl">
              Lleva tu club al siguiente nivel
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground">
              Únete a los clubes que ya gestionan su día a día con Verda.
              Configúralo en minutos.
            </p>
            <div className="relative mt-8 flex justify-center">
              <Button size="lg" asChild>
                <Link href="/register">
                  Empezar gratis <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Verda. Hecho para asociaciones cannábicas.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/registro-socio" className="hover:text-foreground">Hazte socio</Link>
            <Link href="/legal" className="hover:text-foreground">Privacidad</Link>
            <Link href="/login" className="hover:text-foreground">Entrar</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
