import Link from "next/link";
import { CheckCircle2, ClipboardList, Hourglass, ListTodo, PartyPopper, Send, TriangleAlert } from "lucide-react";
import { AssignmentCard } from "@/components/assignments/assignment-card";
import { Card } from "@/components/ui/card";
import { LocalTime } from "@/components/ui/local-time";
import { currentStudent } from "@/lib/student";
import { countBy, FILTERS, loadStudentAssignments, type FilterKey } from "@/lib/student-assignments";

export default async function StudentDashboard() {
  const { user, student } = await currentStudent();
  const items = await loadStudentAssignments(student);
  const pending = items.filter((i) => (FILTERS.pending.statuses as readonly string[]).includes(i.status));
  const recent = items.filter((i) => i.status === "EVALUATED" && i.result).sort((a, b) => b.result!.evaluatedAt.localeCompare(a.result!.evaluatedAt)).slice(0, 4);

  const stats: { label: string; value: number; icon: typeof ListTodo; filter: FilterKey }[] = [
    { label: "Assigned", value: items.length, icon: ClipboardList, filter: "all" },
    { label: "Pending", value: countBy(items, "pending"), icon: ListTodo, filter: "pending" },
    { label: "Submitted", value: countBy(items, "submitted"), icon: Send, filter: "submitted" },
    { label: "Evaluated", value: countBy(items, "evaluated"), icon: CheckCircle2, filter: "evaluated" },
    { label: "Overdue", value: countBy(items, "overdue"), icon: TriangleAlert, filter: "overdue" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Hi, {user.name.split(" ")[0]}</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, filter }) => (
          <Link key={label} href={`/student/assignments?filter=${filter}`}>
            <Card className="h-full p-4 transition-shadow hover:shadow-pop">
              <Icon className="h-4 w-4 text-accent" aria-hidden />
              <p className="mt-2 text-2xl font-semibold">{value}</p>
              <p className="text-xs text-ink-soft">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <section aria-labelledby="pending-heading" className="space-y-3">
        <h2 id="pending-heading" className="text-base font-semibold">Pending tasks</h2>
        {pending.length === 0 ? (
          <Card className="flex flex-col items-center py-12 text-center">
            <span className="rounded-full bg-status-green/10 p-4 text-status-green"><PartyPopper className="h-8 w-8" aria-hidden /></span>
            <p className="mt-4 text-lg font-semibold">No Pending Tasks Remaining!</p>
            <p className="mt-1 text-sm text-ink-soft">You're all caught up. New assignments will show up here.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{pending.map((a) => <AssignmentCard key={a.id} a={a} />)}</div>
        )}
      </section>

      <section aria-labelledby="recent-heading" className="space-y-3">
        <h2 id="recent-heading" className="text-base font-semibold">Recently evaluated</h2>
        {recent.length === 0 ? (
          <Card className="flex items-center gap-3 text-sm text-ink-soft"><Hourglass className="h-4 w-4" aria-hidden /> Marks appear here once your faculty publishes them.</Card>
        ) : (
          <Card className="divide-y divide-surface-line p-0">
            {recent.map((a) => (
              <Link key={a.id} href={`/student/assignments/${a.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-surface-muted">
                <div className="min-w-0"><p className="truncate font-medium">{a.title}</p><p className="text-xs text-ink-soft">Evaluated <LocalTime iso={a.result!.evaluatedAt} withTime={false} /></p></div>
                <span className="shrink-0 font-semibold">{a.result!.marks ?? "–"} / {a.maxMarks}</span>
              </Link>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
