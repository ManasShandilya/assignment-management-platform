import Link from "next/link";
import { BookOpenCheck, CheckCircle2, ClipboardList, Clock, Hourglass, TriangleAlert, Users } from "lucide-react";
import { BarCard, CHART_COLORS, DonutCard } from "@/components/charts/charts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LocalTime } from "@/components/ui/local-time";
import { currentFaculty } from "@/lib/faculty";
import { loadFacultyStats } from "@/lib/faculty-stats";

export default async function FacultyDashboard() {
  const { user, faculty } = await currentFaculty();
  const s = await loadFacultyStats(faculty.id);
  const cards = [
    { label: "Total students", value: s.totalStudents, icon: Users },
    { label: "Assignments created", value: s.totalAssignments, icon: ClipboardList },
    { label: "Active assignments", value: s.active, icon: BookOpenCheck },
    { label: "Completed submissions", value: s.completed, icon: CheckCircle2 },
    { label: "Pending submissions", value: s.pending, icon: Hourglass },
    { label: "Late submissions", value: s.late, icon: TriangleAlert },
  ];
  const recentAssignments = s.perAssignment.slice(0, 8).map((a) => ({ name: a.title, Submitted: a.submitted, Pending: Math.max(0, a.expected - a.submitted) }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Welcome, {user.name.split(" ")[0]}</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex items-center gap-4 p-4">
            <span className="rounded-xl bg-accent-soft p-2.5 text-accent"><Icon className="h-5 w-5" aria-hidden /></span>
            <div><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-ink-soft">{label}</p></div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BarCard title="Submissions by assignment" data={recentAssignments} stacked
            series={[{ key: "Submitted", label: "Submitted", color: CHART_COLORS.accent }, { key: "Pending", label: "Pending", color: CHART_COLORS.gray }]} />
        </div>
        <DonutCard title="On time vs late" data={[{ name: "On time", value: s.onTime, color: CHART_COLORS.green }, { name: "Late", value: s.late, color: CHART_COLORS.yellow }]} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-0">
          <h2 className="border-b border-surface-line px-5 py-3 text-sm font-semibold">Recently submitted</h2>
          {s.recent.length === 0 ? <p className="px-5 py-6 text-sm text-ink-soft">No submissions yet.</p> : (
            <ul className="divide-y divide-surface-line">
              {s.recent.map((r) => (
                <li key={r.id}><Link href={`/faculty/submissions/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-surface-muted">
                  <span className="min-w-0"><span className="block truncate font-medium">{r.student}</span><span className="block truncate text-xs text-ink-soft">{r.title}</span></span>
                  <span className="shrink-0 text-right text-xs text-ink-soft"><LocalTime iso={r.at} />{r.late && <> <Badge tone="yellow">Late</Badge></>}</span>
                </Link></li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-0">
          <h2 className="border-b border-surface-line px-5 py-3 text-sm font-semibold">Upcoming deadlines</h2>
          {s.upcoming.length === 0 ? <p className="px-5 py-6 text-sm text-ink-soft">No upcoming deadlines.</p> : (
            <ul className="divide-y divide-surface-line">
              {s.upcoming.map((a) => (
                <li key={a.id}><Link href={`/faculty/submissions?assignment=${a.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-surface-muted">
                  <span className="min-w-0"><span className="block truncate font-medium">{a.title}</span><span className="flex items-center gap-1 text-xs text-ink-soft"><Clock className="h-3 w-3" aria-hidden /><LocalTime iso={a.deadline.toISOString()} /></span></span>
                  <span className="shrink-0 text-xs text-ink-soft">{a.submitted}/{a.expected} in</span>
                </Link></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
