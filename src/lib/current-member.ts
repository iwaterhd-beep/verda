import { members } from "@/lib/mock-data";
import type { Member } from "@/types";

// Socio "autenticado" para la demo del portal.
// En producción vendría de la sesión (Supabase Auth) filtrando por su id.
export const currentMember: Member = members[0];

export function planLimit(member: Member) {
  return member.consumptionLimit;
}
