"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  message?: string;
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const redirectTo = String(formData.get("redirect") || "/dashboard");
  const memberLogin = String(formData.get("rol") || "") === "socio";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: memberLogin
        ? "Credenciales incorrectas. Usa el email y contraseña que te dio el club al aprobar tu solicitud."
        : "Credenciales incorrectas. Revisa tu email y contraseña.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  let isMember = profile?.role === "MEMBER";

  // Respaldo: si el trigger no creó el perfil, detectar socio por tabla members.
  if (!isMember) {
    const { data: memberRow } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    isMember = !!memberRow;
  }

  const wantsPortal =
    memberLogin || redirectTo === "/portal" || redirectTo.startsWith("/portal/");

  if (wantsPortal && !isMember) {
    await supabase.auth.signOut();
    return {
      error:
        "Esta cuenta es de administrador del club, no de socio. Entra con las credenciales que recibiste al aprobar tu solicitud de alta.",
    };
  }

  if (isMember) {
    redirect("/portal");
  }

  redirect(redirectTo && redirectTo !== "/portal" ? redirectTo : "/dashboard");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  const club = String(formData.get("club") || "").trim();

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, club, role: "CLUB_ADMIN" },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    },
  });

  if (error) {
    return { error: error.message };
  }
  if (!data.session) {
    return {
      message:
        "Cuenta creada. Revisa tu email para confirmar y luego inicia sesión.",
    };
  }
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let memberLogin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    memberLogin = profile?.role === "MEMBER";
  }

  await supabase.auth.signOut();
  redirect(memberLogin ? "/login?rol=socio" : "/login");
}
