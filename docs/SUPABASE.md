# 🔌 Verda × Supabase — Guía de conexión

Estado actual de la integración:

- ✅ **Auth real** (registro, login, logout, sesión por cookies)
- ✅ **Middleware** que protege las rutas privadas (`/dashboard`, `/socios`, …)
- ✅ Clientes de Supabase para navegador, servidor y admin (service role)
- ✅ SQL del esquema con tablas + RLS + trigger de alta (`supabase/schema.sql`)
- ⏳ Migración de datos (socios, solicitudes, cartera) de los stores a la BD — siguiente paso

## 1. Variables de entorno

Ya configuradas en `.env.local` (no se sube a git):

```env
NEXT_PUBLIC_SUPABASE_URL="https://amhidiebzuabmzgeaxqq.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..."
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."   # solo servidor
```

> ⚠️ **Rota la `service role key`**: se compartió en el chat. Supabase → *Project Settings → API Keys → Roll*.

## 2. Crear las tablas

1. Abre **Supabase → SQL Editor → New query**.
2. Pega el contenido de [`supabase/schema.sql`](../supabase/schema.sql).
3. **Run**. Crea: `clubs`, `profiles`, `members`, `member_applications`, `wallet_movements`, las políticas RLS y el trigger que crea club + perfil al registrarse un usuario.

## 3. (Desarrollo) Login instantáneo sin confirmar email

Por defecto Supabase exige confirmar el email. Para probar rápido:

- **Auth → Sign In / Providers → Email → desactiva "Confirm email"**.

Así, al registrarte en `/register` entras directo al panel. (En producción déjalo activado.)

## 4. Probar

```bash
npm run dev
```

1. Ve a `/register`, crea tu cuenta de admin → se crea tu club y tu perfil.
2. `/login` para entrar; las rutas privadas quedan protegidas por middleware.
3. "Cerrar sesión" desde el menú de usuario.

## Arquitectura de auth

| Archivo | Rol |
| --- | --- |
| `src/lib/supabase/client.ts` | Cliente de navegador |
| `src/lib/supabase/server.ts` | Cliente de servidor + `createAdminClient()` |
| `src/lib/supabase/middleware.ts` | Refresca sesión y protege rutas |
| `src/middleware.ts` | Punto de entrada del middleware |
| `src/app/(auth)/actions.ts` | Server actions: `signIn`, `signUp`, `signOut` |

## Siguiente paso (datos reales)

Migrar lecturas/escrituras de los stores Zustand a Supabase:

- `member_applications`: el formulario `/registro-socio` inserta filas (RLS ya permite el alta pública); `/solicitudes` las lee y actualiza.
- `members` + `wallet_movements`: socios y cartera persistentes por club.

Prisma (opcional) requiere además la **contraseña de la BD**: Supabase → *Database → Connection string* → rellena `DATABASE_URL` y `DIRECT_URL` en `.env.local`.
