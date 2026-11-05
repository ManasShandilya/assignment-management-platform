import Link from "next/link";
import { AssignmentCard } from "@/components/assignments/assignment-card";
import { Card } from "@/components/ui/card";
import { currentStudent } from "@/lib/student";
import { countBy, FILTERS, loadStudentAssignments, type FilterKey } from "@/lib/student-assignments";
import { cn } from "@/lib/utils";

export default async function MyAssignmentsPage({ searchParams }: { searchParams: { filter?: string } }) {
  const { student } = await currentStudent();
  const filter: FilterKey = searchParams.filter && searchParams.filter in FILTERS ? (searchParams.filter as FilterKey) : "all";
  const items = await loadStudentAssignments(student);
  const statuses = FILTERS[filter].statuses as readonly string[] | null;
  const shown = statuses ? items.filter((i) => statuses.includes(i.status)) : items;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My assignments</h1>
      <nav aria-label="Filter assignments" className="flex flex-wrap gap-2">
        {(Object.keys(FILTERS) as FilterKey[]).map((k) => (
          <Link key={k} href={k === "all" ? "/student/assignments" : `/student/assignments?filter=${k}`} aria-current={filter === k ? "page" : undefined}
            className={cn("rounded-full border px-4 py-1.5 text-sm transition-colors", filter === k ? "border-navy-900 bg-navy-900 text-white" : "border-surface-line bg-white text-ink-soft hover:text-ink")}>
            {FILTERS[k].label} <span className={filter === k ? "text-white/70" : "text-ink-faint"}>{countBy(items, k)}</span>
          </Link>
        ))}
      </nav>
      {shown.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="font-medium">{filter === "all" ? "No assignments yet" : `Nothing in ${FILTERS[filter].label.toLowerCase()}`}</p>
          <p className="mt-1 text-sm text-ink-soft">{filter === "all" ? "Assignments from your faculty will appear here." : "Try another filter."}</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shown.map((a) => <AssignmentCard key={a.id} a={a} />)}</div>
      )}
    </div>
  );
}
