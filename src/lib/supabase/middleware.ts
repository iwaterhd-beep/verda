import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rutas privadas que requieren sesión de administrador/empleado.
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
  const isPortalRoute = pathname === "/portal" || pathname.startsWith("/portal/");

  // Sin sesión en ruta privada -> al login.
  if ((isStaffRoute || isPortalRoute) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Con sesión: separa socios y staff por área.
  if (user && (isStaffRoute || isPortalRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isMember = profile?.role === "MEMBER";

    if (isMember && isStaffRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal";
      url.search = "";
      return NextResponse.redirect(url);
    }
    if (!isMember && isPortalRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("rol", "socio");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
