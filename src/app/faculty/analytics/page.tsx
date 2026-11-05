import { BarCard, CHART_COLORS } from "@/components/charts/charts";
import { Card } from "@/components/ui/card";
import { currentFaculty } from "@/lib/faculty";
import { loadFacultyStats } from "@/lib/faculty-stats";

const pct = (n: number | null) => (n === null ? "–" : `${n}%`);

export default async function AnalyticsPage() {
  const { faculty } = await currentFaculty();
  const s = await loadFacultyStats(faculty.id);
  const metrics = [
    { label: "Average marks", value: pct(s.avgPct) }, { label: "Highest marks", value: pct(s.highPct) }, { label: "Lowest marks", value: pct(s.lowPct) },
    { label: "Submission rate", value: `${s.submissionPct}%` }, { label: "Late submissions", value: `${s.latePct}%` }, { label: "Pending evaluation", value: String(s.pendingEval) },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="mt-1 text-sm text-ink-soft">Marks are shown as a percentage of each assignment's maximum, so different assignments compare fairly. Drafts you haven't published are included.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {metrics.map((m) => <Card key={m.label} className="p-4"><p className="text-2xl font-semibold">{m.value}</p><p className="text-xs text-ink-soft">{m.label}</p></Card>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarCard title="Completion by assignment (%)" max={100} data={s.perAssignment.slice(0, 10).map((a) => ({ name: a.title, Completion: a.completionPct }))} series={[{ key: "Completion", label: "Completion %", color: CHART_COLORS.accent }]} />
        <BarCard title="Student performance (average %)" max={100} data={s.students.map((x) => ({ name: x.name, Average: x.avgPct }))} series={[{ key: "Average", label: "Average %", color: CHART_COLORS.green }]} />
      </div>
      <Card className="overflow-x-auto p-0">
        <h2 className="border-b border-surface-line px-5 py-3 text-sm font-semibold">By assignment</h2>
        {s.perAssignment.length === 0 ? <p className="px-5 py-6 text-sm text-ink-soft">Publish an assignment to see numbers here.</p> : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-surface-line text-xs text-ink-soft"><tr>{["Assignment", "Submitted", "On time", "Late", "Awaiting evaluation", "Average"].map((h) => <th key={h} className="px-3 py-3 font-medium first:px-5">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-surface-line">
              {s.perAssignment.map((a) => (
                <tr key={a.id}><td className="px-5 py-3 font-medium">{a.title}</td><td className="px-3 py-3">{a.submitted}/{a.expected}</td><td className="px-3 py-3">{a.onTime}</td><td className="px-3 py-3">{a.late}</td><td className="px-3 py-3">{a.pendingEval}</td><td className="px-3 py-3">{pct(a.avgPct)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
