# 🤖 Verda — Biblioteca de prompts para IA

Prompts listos para usar con agentes de código (Cursor, Claude, GPT) para seguir construyendo Verda de forma consistente con la arquitectura existente.

## Reglas base (pega esto como contexto al inicio)

```
Trabajas sobre "Verda", un SaaS multi-club para clubes cannábicos.
Stack: Next.js 15 (App Router), TypeScript strict, TailwindCSS 3, shadcn/ui (Radix),
Framer Motion, Zustand, React Query, Prisma + PostgreSQL.
Convenciones:
- Server Components por defecto; "use client" solo si hay interactividad.
- Usa los primitivos de @/components/ui y el helper cn() de @/lib/utils.
- Diseño oscuro premium, glassmorphism, bordes redondeados (rounded-xl/2xl), paleta verde cannabis.
- Multi-tenancy: toda entidad de negocio se filtra por clubId.
- Texto de UI en español. Código y nombres en inglés.
```

## Nuevo módulo CRUD

```
Crea el módulo "<NOMBRE>" siguiendo el patrón de @/app/(dashboard)/socios:
1. Página servidor con <PageHeader> y acciones.
2. Tabla cliente usando @/components/ui/table con búsqueda y filtros.
3. Store Zustand en @/store con filtered().
4. Dialog de creación con validación y toast (sonner).
5. Route Handler REST en @/app/api/<nombre> (GET/POST) con validación.
Reutiliza badges de estado y mantén el estilo visual del resto de la app.
```

## Wiring de Supabase Auth

```
Integra Supabase Auth real: cliente en @/lib/supabase, middleware de sesión que
proteja /dashboard, server actions para login/register/2FA, y mapea el usuario a
nuestro modelo User (RBAC con Role). Mantén las páginas de @/app/(auth) intactas
visualmente, solo conecta la lógica.
```

## Migrar de mock a Prisma

```
Sustituye los datos mock de un módulo por consultas Prisma reales usando @/lib/prisma,
respetando clubId (multi-tenant). Mantén la misma forma de datos que los tipos de @/types
para no romper los componentes.
```

## Componente premium

```
Crea un componente <Nombre> en @/components/<área> con CVA para variantes,
animación sutil con Framer Motion, accesible (roles ARIA, foco visible) y
responsive mobile-first. Estilo glassmorphism coherente con el design system.
```

## Verda AI (automatizaciones)

```
Diseña el endpoint /api/ai/insights que resuma KPIs del club (altas, ingresos,
ocupación, stock bajo) y devuelva recomendaciones accionables en español.
Añade una tarjeta en el dashboard que consuma el endpoint con React Query.
```
