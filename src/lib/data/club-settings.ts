"use client";

import {
  getClubPaymentSettingsAction,
  type ClubPaymentSettings,
} from "@/app/(dashboard)/configuracion/actions";

export type { ClubPaymentSettings };

export async function fetchClubPaymentSettings(): Promise<ClubPaymentSettings | null> {
  const res = await getClubPaymentSettingsAction();
  if (res.error) throw new Error(res.error);
  return res.settings ?? null;
}
