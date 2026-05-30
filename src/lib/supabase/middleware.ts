import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rutas privadas que requieren sesión de administrador/empleado de club.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/socios",
  "/solicitudes",
  "/acceso",
  "/inventario",
  "/pedidos",
  "/tpv",
  "/reservas",
  "/comunicacion",
  "/legal",
  "/configuracion",
];

const SUPER_ADMIN_PREFIX = "/super-admin";

function routeFlags(pathname: string) {
  const isStaffRoute = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  const isPortalRoute =
    pathname === "/portal" || pathname.startsWith("/portal/");
  const isSuperAdminRoute =
    pathname === SUPER_ADMIN_PREFIX ||
    pathname.startsWith(SUPER_ADMIN_PREFIX + "/");
  const isSuperAdminSetup = pathname === "/super-admin/setup";
  return { isStaffRoute, isPortalRoute, isSuperAdminRoute, isSuperAdminSetup };
}

function redirectToLogin(
  request: NextRequest,
  pathname: string,
  isSuperAdminRoute: boolean,
  rol?: "socio",
) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set(
    "redirect",
    isSuperAdminRoute ? "/super-admin" : pathname,
  );
  if (rol) url.searchParams.set("rol", rol);
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { isStaffRoute, isPortalRoute, isSuperAdminRoute, isSuperAdminSetup } =
    routeFlags(pathname);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sin variables de Supabase: no romper el middleware en Vercel.
  if (!supabaseUrl || !supabaseAnonKey) {
    const needsAuth =
      isStaffRoute ||
      isPortalRoute ||
      (isSuperAdminRoute && !isSuperAdminSetup);
    if (needsAuth) {
      return redirectToLogin(request, pathname, isSuperAdminRoute);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Sin sesión en ruta privada -> al login.
    if ((isStaffRoute || isPortalRoute || isSuperAdminRoute) && !user) {
      if (isSuperAdminSetup) {
        return supabaseResponse;
      }
      return redirectToLogin(request, pathname, isSuperAdminRoute);
    }

    // Con sesión: separa socios, staff de club y super admin.
    if (user && (isStaffRoute || isPortalRoute || isSuperAdminRoute)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role;
      const isMember = role === "MEMBER";
      const isSuperAdmin = role === "SUPER_ADMIN";

      if (isSuperAdminSetup && isSuperAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/super-admin";
        url.search = "";
        return NextResponse.redirect(url);
      }

      if (isSuperAdminRoute && !isSuperAdminSetup && !isSuperAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = isMember ? "/portal" : "/dashboard";
        url.search = "";
        return NextResponse.redirect(url);
      }

      if (isSuperAdmin && (isStaffRoute || isPortalRoute)) {
        const url = request.nextUrl.clone();
        url.pathname = "/super-admin";
        url.search = "";
        return NextResponse.redirect(url);
      }

      if (isMember && isStaffRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/portal";
        url.search = "";
        return NextResponse.redirect(url);
      }
      if (!isMember && !isSuperAdmin && isPortalRoute) {
        return redirectToLogin(request, pathname, isSuperAdminRoute, "socio");
      }
    }

    return supabaseResponse;
  } catch {
    // Evita 500 MIDDLEWARE_INVOCATION_FAILED; deja cargar rutas públicas.
    const needsAuth =
      isStaffRoute ||
      isPortalRoute ||
      (isSuperAdminRoute && !isSuperAdminSetup);
    if (needsAuth) {
      return redirectToLogin(request, pathname, isSuperAdminRoute);
    }
    return NextResponse.next({ request });
  }
}
