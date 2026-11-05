import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LocalTime } from "@/components/ui/local-time";
import { SubmitPanel } from "@/components/submissions/submit-panel";
import { currentStudent } from "@/lib/student";
import { loadSubmittable } from "@/lib/submissions";
import { cn } from "@/lib/utils";

export default async function SubmitPage({ searchParams }: { searchParams: { assignment?: string } }) {
  const { student } = await currentStudent();
  const open = await loadSubmittable(student);
  const selected = open.find((o) => o.assignment.id === searchParams.assignment) ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Submit assignment</h1>
      {open.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="font-medium">Nothing to submit right now</p>
          <p className="mt-1 text-sm text-ink-soft">Assignments that are open for submission will appear here.</p>
        </Card>
      ) : (
        <>
          <section aria-labelledby="pick" className="space-y-2">
            <h2 id="pick" className="text-sm font-semibold">Choose an assignment</h2>
            <ul className="grid gap-2">
              {open.map(({ assignment: a }) => (
                <li key={a.id}>
                  <Link href={`/student/submit?assignment=${a.id}`} aria-current={selected?.assignment.id === a.id ? "true" : undefined}
                    className={cn("flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm transition-colors",
                      selected?.assignment.id === a.id ? "border-accent ring-1 ring-accent" : "border-surface-line hover:border-accent-ring")}>
                    <span className="min-w-0"><span className="block truncate font-medium">{a.title}</span><span className="text-xs text-ink-soft">{a.course.name}</span></span>
                    <span className="shrink-0 text-xs text-ink-soft">Due <LocalTime iso={a.deadline.toISOString()} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          {selected ? <SubmitPanel key={selected.assignment.id} {...selected.panel} /> : <p className="text-sm text-ink-soft">Pick an assignment above to upload your work.</p>}
        </>
      )}
    </div>
  );
}
