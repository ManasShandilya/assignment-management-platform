import Link from "next/link";
import { Hourglass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LocalTime } from "@/components/ui/local-time";
import { currentStudent } from "@/lib/student";
import { loadStudentAssignments, STATUS_META } from "@/lib/student-assignments";

const WITH_SUBMISSION = ["SUBMITTED", "UNDER_EVALUATION", "EVALUATED", "RETURNED"];

export default async function ResultsPage() {
  const { student } = await currentStudent();
  const rows = (await loadStudentAssignments(student)).filter((i) => WITH_SUBMISSION.includes(i.status));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My results</h1>
      {rows.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="font-medium">No results yet</p>
          <p className="mt-1 text-sm text-ink-soft">Once you submit an assignment, its result shows up here.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => {
            const meta = STATUS_META[a.status];
            return (
              <Card key={a.id} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/student/assignments/${a.id}`} className="font-semibold hover:text-accent">{a.title}</Link>
                    <p className="text-xs text-ink-soft">{a.courseName} · Maximum marks {a.maxMarks}</p>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
                {a.result && a.result.marks !== null ? (
                  <div>
                    <p className="text-2xl font-semibold">{a.result.marks} <span className="text-base font-normal text-ink-soft">/ {a.maxMarks}</span></p>
                    {a.result.penaltyPct > 0 && <p className="text-xs text-ink-soft">Includes a {a.result.penaltyPct}% late penalty</p>}
                  </div>
                ) : a.status === "RETURNED" ? (
                  <p className="text-sm">This submission was returned for correction. <Link href={`/student/assignments/${a.id}`} className="font-medium text-accent hover:underline">Open it to upload a new version</Link>.</p>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-ink-soft"><Hourglass className="h-4 w-4" aria-hidden /> Your submission is awaiting evaluation.</p>
                )}
                {a.result?.feedback && (
                  <div className="rounded-xl bg-surface-muted p-3 text-sm"><p className="text-xs font-medium text-ink-soft">Faculty feedback</p><p className="mt-1 whitespace-pre-wrap">{a.result.feedback}</p></div>
                )}
                {a.result && <p className="text-xs text-ink-faint">{a.result.marks !== null ? "Evaluated" : "Returned"} <LocalTime iso={a.result.evaluatedAt} /></p>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
