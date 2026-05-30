import type {
  AccessLog,
  KpiPoint,
  Member,
  Product,
  Reservation,
  Sale,
} from "@/types";

/** Datos demo vacíos — la app usa Supabase en producción. */
export const members: Member[] = [];
export const accessLogs: AccessLog[] = [];
export const products: Product[] = [];
export const sales: Sale[] = [];
export const reservations: Reservation[] = [];
export const revenueSeries: KpiPoint[] = [];
export const newMembersSeries: KpiPoint[] = [];
export const occupancySeries: KpiPoint[] = [];
export const planDistribution: { name: string; value: number; color: string }[] = [];
