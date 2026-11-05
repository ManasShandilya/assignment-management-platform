import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Eye, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LocalTime } from "@/components/ui/local-time";
import { EvaluationForm } from "@/components/submissions/evaluation-form";
import { db } from "@/lib/db";
import { currentFaculty } from "@/lib/faculty";
import { sectionLabel } from "@/lib/labels";
import { humanDuration } from "@/lib/time";

const size = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default async function ReviewSubmissionPage({ params }: { params: { id: string } }) {
  const { faculty } = await currentFaculty();
  const sub = await db.submission.findFirst({
    where: { id: params.id, assignment: { facultyId: faculty.id } },
    include: {
      assignment: { include: { section: { include: { course: true } } } }, files: true, evaluation: true,
      student: { select: { regNo: true, user: { select: { name: true } } } },
    },
  });
  if (!sub) notFound();
  const versions = await db.submission.findMany({
    where: { assignmentId: sub.assignmentId, studentId: sub.studentId }, orderBy: { version: "desc" },
    select: { id: true, version: true, submittedAt: true, isLate: true },
  });
  const a = sub.assignment;
  const diff = sub.submittedAt.getTime() - a.deadline.getTime();
  const ev = sub.evaluation;
  const mode = versions[0].id !== sub.id ? "SUPERSEDED" : sub.status === "RETURNED" ? "RETURNED" : "EDITABLE";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/faculty/submissions" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden /> Submissions</Link>
      <div>
        <h1 className="text-2xl font-semibold">{sub.student.user.name}</h1>
        <p className="mt-1 text-sm text-ink-soft">{sub.student.regNo} · {a.title} · {sectionLabel(a.section)}</p>
      </div>

      <Card>
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-ink-soft">Submitted</dt><dd className="font-medium"><LocalTime iso={sub.submittedAt.toISOString()} precise /></dd></div>
          <div><dt className="text-xs text-ink-soft">Deadline</dt><dd className="font-medium"><LocalTime iso={a.deadline.toISOString()} precise /></dd></div>
          <div>
            <dt className="text-xs text-ink-soft">Timing</dt>
            <dd className="font-medium"><Badge tone={sub.isLate ? "yellow" : "green"}>{sub.isLate ? "Late" : "On time"}</Badge> <span className="text-xs font-normal text-ink-soft">{humanDuration(diff)} {diff > 0 ? "after" : "before"} the deadline</span></dd>
          </div>
        </dl>
      </Card>

      <Card className="p-0">
        <h2 className="border-b border-surface-line px-5 py-3 text-sm font-semibold">Submitted files · version {sub.version}</h2>
        <ul className="divide-y divide-surface-line">
          {sub.files.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <span className="flex min-w-0 items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden /><span className="truncate">{f.originalName}</span><span className="shrink-0 text-xs text-ink-faint">{size(f.sizeBytes)}</span></span>
              <span className="flex shrink-0 gap-1">
                {f.mimeType === "application/pdf" && <a href={`/api/files/submissions/${f.id}?inline=1`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-ink-soft hover:bg-surface-muted"><Eye className="h-4 w-4" aria-hidden /> Preview</a>}
                <a href={`/api/files/submissions/${f.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-ink-soft hover:bg-surface-muted"><Download className="h-4 w-4" aria-hidden /> Download</a>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {versions.length > 1 && (
        <Card className="p-0">
          <h2 className="border-b border-surface-line px-5 py-3 text-sm font-semibold">All versions</h2>
          <ul className="divide-y divide-surface-line text-sm">
            {versions.map((v) => (
              <li key={v.id}>
                <Link href={`/faculty/submissions/${v.id}`} aria-current={v.id === sub.id ? "page" : undefined} className="flex items-center justify-between px-5 py-3 hover:bg-surface-muted">
                  <span className={v.id === sub.id ? "font-medium" : ""}>Version {v.version}</span>
                  <span className="text-xs text-ink-soft"><LocalTime iso={v.submittedAt.toISOString()} precise /> · {v.isLate ? "Late" : "On time"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <EvaluationForm
        submissionId={sub.id} maxMarks={a.maxMarks} isLate={sub.isLate} penaltyPct={a.latePenaltyPct} mode={mode}
        initial={{ marks: ev?.rawMarks ?? ev?.marks ?? null, feedback: ev?.feedback ?? "", remarks: ev?.remarks ?? "", published: !!ev?.published && sub.status !== "RETURNED" }}
      />
    </div>
  );
}
