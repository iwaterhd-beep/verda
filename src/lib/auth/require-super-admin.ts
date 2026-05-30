import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { Role } from "@/types";

export interface SuperAdminContext {
  userId: string;
  email: string;
  name: string;
  admin: ReturnType<typeof createAdminClient>;
}

export async function requireSuperAdmin(): Promise<
  { ok: true; ctx: SuperAdminContext } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No has iniciado sesión." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name, email")
    .eq("id", user.id)
    .single();

  if ((profile?.role as Role | undefined) !== "SUPER_ADMIN") {
    return { ok: false, error: "No tienes permisos de super admin." };
  }

  return {
    ok: true,
    ctx: {
      userId: user.id,
      email: profile?.email ?? user.email ?? "",
      name: profile?.name ?? user.email?.split("@")[0] ?? "Super Admin",
      admin: createAdminClient(),
    },
  };
}
