import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Eye, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LocalTime } from "@/components/ui/local-time";
import { RemainingTime } from "@/components/ui/remaining-time";
import { SubmissionSummary } from "@/components/submissions/submission-summary";
import { SubmitPanel } from "@/components/submissions/submit-panel";
import { db } from "@/lib/db";
import { currentStudent } from "@/lib/student";
import { loadStudentAssignments, STATUS_META, visibleWhere } from "@/lib/student-assignments";
import { panelPropsFor } from "@/lib/submissions";

const kb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default async function AssignmentDetailPage({ params }: { params: { id: string } }) {
  const { student } = await currentStudent();
  // Same visibility rule as the list: a student can't open an assignment that isn't theirs.
  const a = await db.assignment.findFirst({
    where: { id: params.id, ...visibleWhere(student) },
    include: { attachments: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true, isReference: true } } },
  });
  if (!a) notFound();
  const item = (await loadStudentAssignments(student)).find((i) => i.id === a.id);
  if (!item) notFound();
  const where = { assignmentId: a.id, studentId: student.id };
  const [latest, versionCount] = await Promise.all([
    db.submission.findFirst({ where, orderBy: { version: "desc" }, include: { files: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true } } } }),
    db.submission.count({ where }),
  ]);
  const panel = panelPropsFor(a, latest, new Date());
  const meta = STATUS_META[item.status];
  const finished = ["SUBMITTED", "UNDER_EVALUATION", "EVALUATED"].includes(item.status);

  const rules = [
    `Accepted formats: ${a.allowedFormats.map((f) => f.toUpperCase()).join(", ")}`,
    `Maximum file size: ${a.maxFileSizeMb} MB`,
    a.allowMultiple ? "You can upload several files" : "One file per submission",
    a.allowResubmission ? "Resubmission is allowed" : "Resubmission is not allowed",
    a.allowLate ? `Late submissions are accepted${a.latePenaltyPct ? ` with a ${a.latePenaltyPct}% penalty` : ""}` : "Late submissions are not accepted",
  ];
  const groups = [["Question paper", a.attachments.filter((x) => !x.isReference)], ["Reference materials", a.attachments.filter((x) => x.isReference)]] as const;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/student/assignments" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden /> My assignments</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{item.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{item.courseName} · {item.facultyName}</p>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      <Card>
        <dl className="grid gap-4 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-ink-soft">Assigned</dt><dd className="font-medium"><LocalTime iso={item.createdAt} withTime={false} /></dd></div>
          <div><dt className="text-xs text-ink-soft">Deadline</dt><dd className="font-medium"><LocalTime iso={item.deadline} /></dd></div>
          <div><dt className="text-xs text-ink-soft">{finished ? "Submitted" : "Time left"}</dt><dd className="font-medium">{finished && item.submittedAt ? <LocalTime iso={item.submittedAt} /> : <RemainingTime iso={item.deadline} />}</dd></div>
          <div><dt className="text-xs text-ink-soft">Maximum marks</dt><dd className="font-medium">{item.maxMarks}</dd></div>
        </dl>
        {item.result && (
          <div className="mt-4 rounded-xl bg-status-green/10 p-4 text-sm">
            {item.result.marks !== null && <p className="font-semibold">Marks: {item.result.marks} / {item.maxMarks}{item.result.penaltyPct > 0 && <span className="ml-2 font-normal text-ink-soft">({item.result.penaltyPct}% late penalty applied)</span>}</p>}
            {item.result.feedback && <p className="mt-1 whitespace-pre-wrap text-ink-soft">{item.result.feedback}</p>}
          </div>
        )}
      </Card>

      {latest && <SubmissionSummary s={{ version: latest.version, versionCount, submittedAt: latest.submittedAt.toISOString(), isLate: latest.isLate, returned: latest.status === "RETURNED", files: latest.files }} />}
      <SubmitPanel {...panel} />

      <Card className="space-y-4">
        <div><h2 className="text-sm font-semibold">Description</h2><p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{a.description}</p></div>
        {a.instructions && <div><h2 className="text-sm font-semibold">Instructions</h2><p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{a.instructions}</p></div>}
        <div><h2 className="text-sm font-semibold">Submission rules</h2><ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-soft">{rules.map((r) => <li key={r}>{r}</li>)}</ul></div>
      </Card>

      {groups.map(([label, files]) => files.length > 0 && (
        <Card key={label} className="p-0">
          <h2 className="border-b border-surface-line px-5 py-3 text-sm font-semibold">{label}</h2>
          <ul className="divide-y divide-surface-line">
            {files.map((f) => {
              const previewable = f.mimeType === "application/pdf" || f.mimeType.startsWith("image/");
              return (
                <li key={f.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2"><Paperclip className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden /><span className="truncate">{f.originalName}</span><span className="shrink-0 text-xs text-ink-faint">{kb(f.sizeBytes)}</span></span>
                  <span className="flex shrink-0 gap-1">
                    {previewable && <a href={`/api/files/attachments/${f.id}?inline=1`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-ink-soft hover:bg-surface-muted"><Eye className="h-4 w-4" aria-hidden /> Preview</a>}
                    <a href={`/api/files/attachments/${f.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-ink-soft hover:bg-surface-muted"><Download className="h-4 w-4" aria-hidden /> Download</a>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
    </div>
  );
}
