import type { Member } from "@/types";

/** Fallback mínimo cuando no hay sesión de socio (valores en cero). */
export const currentMember: Member = {
  id: "",
  fullName: "Socio",
  email: "",
  phone: "",
  documentType: "DNI",
  documentId: "",
  birthDate: "2000-01-01",
  status: "PENDING",
  membershipPlan: "BASIC",
  joinedAt: "",
  expiresAt: "",
  qrCode: "—",
  consumptionLimit: 40,
  consumedThisMonth: 0,
  signatureSigned: false,
  ageVerified: false,
  avatarSeed: "Socio",
  walletBalance: 0,
};

export function planLimit(member: Member) {
  return member.consumptionLimit;
}
