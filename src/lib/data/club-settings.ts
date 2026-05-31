"use client";

import { getClubPaymentSettingsAction } from "@/app/(dashboard)/configuracion/actions";
import type { ClubPaymentSettings } from "@/lib/club-payment-settings";

export type { ClubPaymentSettings };

export async function fetchClubPaymentSettings(): Promise<ClubPaymentSettings | null> {
  const res = await getClubPaymentSettingsAction();
  if (res.error) throw new Error(res.error);
  return res.settings ?? null;
}
