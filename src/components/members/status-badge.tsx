import { Badge } from "@/components/ui/badge";
import type { MembershipStatus } from "@/types";

const map: Record<
  MembershipStatus,
  { label: string; variant: "success" | "warning" | "secondary" | "destructive" }
> = {
  ACTIVE: { label: "Activo", variant: "success" },
  PENDING: { label: "Pendiente", variant: "warning" },
  EXPIRED: { label: "Caducado", variant: "secondary" },
  SUSPENDED: { label: "Suspendido", variant: "warning" },
  BLOCKED: { label: "Bloqueado", variant: "destructive" },
};

export function StatusBadge({ status }: { status: MembershipStatus }) {
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

const planMap: Record<string, { label: string; className: string }> = {
  BASIC: { label: "Básico", className: "bg-secondary text-secondary-foreground" },
  PREMIUM: { label: "Premium", className: "bg-primary/15 text-primary" },
  VIP: { label: "VIP", className: "bg-emerald-500/15 text-emerald-400" },
};

export function PlanBadge({ plan }: { plan: string }) {
  const p = planMap[plan] ?? planMap.BASIC;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${p.className}`}
    >
      {p.label}
    </span>
  );
}
