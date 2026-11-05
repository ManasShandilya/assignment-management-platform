"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type CalEvent = { id: string; date: string; title: string; kind: "created" | "deadline" | "submitted" | "overdue"; href: string };
const KINDS = {
  created: { label: "Assigned", dot: "bg-status-gray" },
  deadline: { label: "Deadline", dot: "bg-status-blue" },
  submitted: { label: "Submission", dot: "bg-status-green" },
  overdue: { label: "Overdue", dot: "bg-status-red" },
} as const;
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// Built on the client so "today" and every date use the viewer's own time zone.
export function CalendarGrid({ events }: { events: CalEvent[] }) {
  const [cursor, setCursor] = useState<Date | null>(null);
  const [selected, setSelected] = useState("");
  useEffect(() => { const n = new Date(); setCursor(new Date(n.getFullYear(), n.getMonth(), 1)); setSelected(key(n)); }, []);

  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of events) { const k = key(new Date(e.date)); m.set(k, [...(m.get(k) ?? []), e]); }
    return m;
  }, [events]);

  if (!cursor) return <Skeleton className="h-96 w-full" />;
  const offset = cursor.getDay();
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => (i >= offset && i < offset + days ? new Date(cursor.getFullYear(), cursor.getMonth(), i - offset + 1) : null));
  const today = key(new Date());
  const move = (n: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
  const dayEvents = byDay.get(selected) ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}</h2>
          <div className="flex gap-1">
            <button aria-label="Previous month" onClick={() => move(-1)} className="rounded-lg p-2 hover:bg-surface-muted"><ChevronLeft className="h-4 w-4" /></button>
            <button aria-label="Next month" onClick={() => move(1)} className="rounded-lg p-2 hover:bg-surface-muted"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-soft">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-1">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const k = key(d);
            const evs = byDay.get(k) ?? [];
            const kinds = [...new Set(evs.map((e) => e.kind))];
            return (
              <button key={i} onClick={() => setSelected(k)} aria-pressed={selected === k} aria-label={`${d.toDateString()}, ${evs.length} events`}
                className={cn("flex h-14 flex-col items-center rounded-xl border pt-1.5 text-sm transition-colors sm:h-16",
                  selected === k ? "border-accent bg-accent-soft" : "border-transparent hover:bg-surface-muted", k === today && "font-semibold text-accent")}>
                {d.getDate()}
                <span className="mt-1 flex gap-0.5">{kinds.map((kd) => <span key={kd} className={cn("h-1.5 w-1.5 rounded-full", KINDS[kd].dot)} />)}</span>
              </button>
            );
          })}
        </div>
        <ul className="mt-4 flex flex-wrap gap-4 text-xs text-ink-soft">{Object.values(KINDS).map((k) => <li key={k.label} className="flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", k.dot)} />{k.label}</li>)}</ul>
      </Card>
      <Card className="p-0">
        <h3 className="border-b border-surface-line px-5 py-3 text-sm font-semibold">{selected ? new Date(Number(selected.split("-")[0]), Number(selected.split("-")[1]), Number(selected.split("-")[2])).toLocaleDateString(undefined, { dateStyle: "full" }) : ""}</h3>
        {dayEvents.length === 0 ? <p className="px-5 py-6 text-sm text-ink-soft">Nothing on this day.</p> : (
          <ul className="divide-y divide-surface-line">
            {dayEvents.map((e) => (
              <li key={e.id}><Link href={e.href} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-surface-muted">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", KINDS[e.kind].dot)} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{e.title}</span>
                <span className="shrink-0 text-xs text-ink-soft">{KINDS[e.kind].label} · {new Date(e.date).toLocaleTimeString(undefined, { timeStyle: "short" })}</span>
              </Link></li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
