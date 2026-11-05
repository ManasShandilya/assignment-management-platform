"use client";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";

export const CHART_COLORS = { accent: "#3B6FE0", green: "#1F9D61", red: "#D64545", yellow: "#C98A0B", gray: "#C5CDDB" };

function Frame({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {empty ? <p className="flex h-[240px] items-center justify-center text-sm text-ink-soft">Nothing to chart yet</p> : <div className="h-[240px]" role="img" aria-label={title}>{children}</div>}
    </Card>
  );
}

export function BarCard({ title, data, series, stacked, max }: {
  title: string; data: Record<string, string | number>[]; series: { key: string; label: string; color: string }[]; stacked?: boolean; max?: number;
}) {
  return (
    <Frame title={title} empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -16, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E9F2" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} tickFormatter={(v: string) => (v.length > 10 ? `${v.slice(0, 9)}…` : v)} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} domain={max ? [0, max] : undefined} />
          <Tooltip cursor={{ fill: "#F6F8FC" }} />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} stackId={stacked ? "a" : undefined} radius={stacked ? 0 : [4, 4, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    </Frame>
  );
}

export function DonutCard({ title, data }: { title: string; data: { name: string; value: number; color: string }[] }) {
  return (
    <Frame title={title} empty={data.every((d) => d.value === 0)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </Frame>
  );
}
