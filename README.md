# 🌿 Verda — El sistema operativo para clubes cannábicos

Plataforma **SaaS multi-club** premium para la gestión integral de asociaciones cannábicas: socios, control de acceso, inventario, TPV, reservas, comunicación interna y cumplimiento legal (RGPD). Inspirada en la experiencia de producto de **Stripe, Linear, Notion, Clerk y Supabase**.

> Diseño oscuro premium · Glassmorphism · Mobile-first · Arquitectura escalable · Lista para producción.

---

## ✨ Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Framework | **Next.js 15** (App Router, RSC, Route Handlers) |
| Lenguaje | **TypeScript** (strict) |
| UI | **TailwindCSS 3** + **shadcn/ui** (Radix UI) |
| Animación | **Framer Motion** |
| Estado | **Zustand** (cliente) + **React Query** (servidor) |
| Datos | **Prisma ORM** + **PostgreSQL** |
| Auth | **Supabase Auth** (o Firebase) + 2FA + RBAC |
| Gráficos | **Recharts** |
| Notificaciones | **Sonner** |
| Despliegue | **Vercel** |

---

## 🚀 Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
cp .env.example .env   # rellena DATABASE_URL, claves de Supabase, etc.

# 3. (Opcional) Base de datos
npm run db:generate    # genera el cliente Prisma
npm run db:push        # crea las tablas
npm run db:seed        # datos de demo

# 4. Arrancar
npm run dev            # http://localhost:3000
```

> **La demo funciona sin base de datos**: el panel usa datos mock (`src/lib/mock-data.ts`) y un store Zustand, por lo que puedes explorar toda la UI con solo `npm run dev`.

### Rutas principales

| Ruta | Descripción |
| --- | --- |
| `/` | Landing page (marketing) |
| `/login` · `/register` · `/forgot-password` | Autenticación + 2FA |
| `/dashboard` | Dashboard con KPIs y gráficos |
| `/socios` · `/socios/[id]` | CRUD de socios + ficha completa |
| `/acceso` | Control de acceso QR |
| `/inventario` · `/tpv` · `/reservas` | Operaciones |
| `/comunicacion` · `/legal` · `/configuracion` | Gestión |
| `/api/socios` | API REST de ejemplo (GET/POST) |

---

## 🏛️ Arquitectura

```
src/
├── app/
│   ├── (marketing)/          # Landing pública (SEO)
│   ├── (auth)/               # Login, registro, recuperación, 2FA
│   ├── (dashboard)/          # Panel privado (layout con sidebar)
│   │   ├── dashboard/        # KPIs + analytics
│   │   ├── socios/           # Gestión de socios (CRUD)
│   │   ├── acceso/           # Control de acceso QR
│   │   ├── inventario/       # Stock, lotes, caducidad
│   │   ├── tpv/              # Punto de venta
│   │   ├── reservas/         # Reservas y espacios
│   │   ├── comunicacion/     # Avisos push/email/internos
│   │   ├── legal/            # RGPD, auditoría, export
│   │   └── configuracion/    # Branding, multi-club, roles
│   ├── api/                  # Route Handlers (REST)
│   ├── layout.tsx            # Root + Providers
│   └── globals.css           # Design tokens
├── components/
│   ├── ui/                   # Primitivos shadcn/ui reutilizables
│   ├── dashboard/            # Sidebar, topbar, KPI cards, page header
│   ├── members/              # Tabla, dialog y badges de socios
│   ├── charts/               # Gráficos Recharts
│   ├── marketing/            # Navbar, reveal animations
│   └── brand/                # Logo
├── lib/                      # utils, mock-data, prisma, nav
├── store/                    # Zustand stores
└── types/                    # Tipos compartidos
prisma/
├── schema.prisma             # 16 modelos · 10 módulos · multi-tenant
└── seed.ts                   # Datos de demo
```

### Principios

- **Multi-tenancy por `clubId`**: todas las entidades de negocio están aisladas por club; trivial escalar a redes de asociaciones.
- **Route groups** para separar marketing / auth / app sin afectar a las URLs.
- **Server Components por defecto**, Client Components solo donde hay interactividad.
- **Componentes desacoplados y reutilizables** (sistema de diseño con CVA).

---

## 🎨 Sistema de diseño

Tokens en `src/app/globals.css` mediante variables CSS HSL, con tema claro y oscuro.

**Paleta**

| Token | Uso |
| --- | --- |
| Negro carbón `160 14% 5%` | Fondo dark |
| Verde cannabis `142 64% 45%` | Primario / acentos |
| Grises suaves | Bordes, muted, secundarios |
| Blancos cálidos `40 18% 94%` | Texto / fondo claro |

**Utilidades premium**: `.glass`, `.glass-card`, `.border-glow`, `.text-gradient-green`, `bg-verda-mesh`, `bg-dots`, sombras `shadow-glow` / `shadow-soft`, radios redondeados (`--radius: 0.85rem`).

---

## 🔐 Seguridad y cumplimiento

- **RBAC** con 4 roles: `SUPER_ADMIN`, `CLUB_ADMIN`, `EMPLOYEE`, `MEMBER`.
- **2FA** (TOTP) integrado en el flujo de login.
- **RGPD / LOPDGDD**: consentimientos versionados, derecho al olvido, exportación de datos y **registro de auditoría inmutable** (`AuditLog`).
- **Anti-fraude**: QR únicos por socio, verificación de edad obligatoria, límites de consumo mensual y bloqueo automático por membresía caducada.
- **Cifrado** AES-256 en reposo y TLS en tránsito (recomendado a nivel de proveedor).
- Validación de entrada en cada Route Handler.

---

## 🤖 Extras incluidos

- **Verda AI** (placeholder UI): automatizaciones, resúmenes y asistencia.
- **Onboarding** con registro de club en segundos.
- **Panel de analytics** con KPIs, ingresos, altas y distribución de planes.
- **Automatizaciones sugeridas**: renovación automática de membresías, avisos de stock bajo, recordatorios de caducidad, bloqueo de accesos.

### 💰 Monetización (sugerida)

1. **Suscripción SaaS por club** (Starter gratis · Pro 79 €/mes · Multi-club a medida).
2. **Comisión por transacción** opcional sobre el TPV/monedero.
3. **Add-ons**: Verda AI, SMS/WhatsApp (Twilio), pasarela de pagos.
4. **Plan enterprise** para redes con SSO, API y soporte prioritario.

---

## ☁️ Despliegue en Vercel

1. Sube el repo a GitHub e impórtalo en **Vercel**.
2. Configura las variables de entorno (`.env.example`).
3. Usa **Supabase** o **Vercel Postgres** para la base de datos (`DATABASE_URL` + `DIRECT_URL`).
4. `npm run db:push` en el primer despliegue.
5. Deploy automático en cada push a `main`.

---

## 🗺️ Roadmap

- [ ] Wiring real de Supabase Auth + middleware de sesión
- [ ] Generación real de QR/PDF del carnet de socio
- [ ] tRPC end-to-end typesafe (alternativa a REST)
- [ ] App móvil de socio (PWA)
- [ ] Webhooks de Stripe para suscripciones
- [ ] Tests (Vitest + Playwright)

---

Hecho con 🌿 para asociaciones cannábicas. **Verda**.
