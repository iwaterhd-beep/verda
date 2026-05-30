"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { KpiPoint } from "@/types";
import { formatCurrency } from "@/lib/utils";

const axisStyle = {
  fontSize: 11,
  fill: "hsl(var(--muted-foreground))",
};

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="glass-card rounded-lg px-3 py-2 text-xs shadow-soft">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold">
        {formatter ? formatter(value) : value}
      </p>
    </div>
  );
}

export function RevenueAreaChart({ data }: { data: KpiPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(142 64% 45%)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="hsl(142 64% 45%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisStyle} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={axisStyle}
          tickFormatter={(v) => `${v / 1000}k`}
        />
        <Tooltip
          content={<ChartTooltip formatter={(v) => formatCurrency(v)} />}
          cursor={{ stroke: "hsl(var(--border))" }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(142 64% 45%)"
          strokeWidth={2.5}
          fill="url(#rev)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MembersBarChart({ data }: { data: KpiPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisStyle} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: "hsl(var(--secondary) / 0.5)" }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="hsl(142 64% 45%)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PlanDonutChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={3}
          strokeWidth={0}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
