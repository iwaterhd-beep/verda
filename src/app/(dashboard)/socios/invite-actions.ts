"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAppBaseUrl } from "@/lib/app-url";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ClubInviteInfo {
  id: string;
  name: string;
}

export interface MemberInviteLinkResult {
  error?: string;
  url?: string;
  clubName?: string;
}


export async function fetchClubInviteInfoAction(
  clubId: string,
): Promise<ClubInviteInfo | null> {
  if (!UUID_RE.test(clubId)) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("clubs")
    .select("id, name")
    .eq("id", clubId)
    .maybeSingle();

  if (!data) return null;
  return { id: data.id, name: data.name };
}

export async function getMemberInviteLinkAction(): Promise<MemberInviteLinkResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No has iniciado sesión." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role === "MEMBER" || !profile.club_id) {
    return { error: "No tienes permisos." };
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("name")
    .eq("id", profile.club_id)
    .single();

  const url = `${await getAppBaseUrl()}/registro-socio?club=${profile.club_id}`;

  return {
    url,
    clubName: club?.name ?? "Tu club",
  };
}
