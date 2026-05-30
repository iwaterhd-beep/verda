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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isStaffRoute = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  const isPortalRoute =
    pathname === "/portal" || pathname.startsWith("/portal/");
  const isSuperAdminRoute =
    pathname === SUPER_ADMIN_PREFIX ||
    pathname.startsWith(SUPER_ADMIN_PREFIX + "/");
  const isSuperAdminSetup = pathname === "/super-admin/setup";

  // Sin sesión en ruta privada -> al login.
  if ((isStaffRoute || isPortalRoute || isSuperAdminRoute) && !user) {
    if (isSuperAdminSetup) {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set(
      "redirect",
      isSuperAdminRoute ? "/super-admin" : pathname,
    );
    return NextResponse.redirect(url);
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
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("rol", "socio");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
