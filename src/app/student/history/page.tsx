import Link from "next/link";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LocalTime } from "@/components/ui/local-time";
import { db } from "@/lib/db";
import { currentStudent } from "@/lib/student";
import { STATUS_META, type UiStatus } from "@/lib/student-assignments";

export default async function HistoryPage() {
  const { student } = await currentStudent();
  const rows = await db.submission.findMany({
    where: { studentId: student.id }, orderBy: { submittedAt: "desc" },
    include: {
      assignment: { select: { id: true, title: true, maxMarks: true } },
      files: { select: { id: true, originalName: true } },
      evaluation: { select: { published: true, marks: true } },
    },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Submission history</h1>
      {rows.length === 0 ? (
        <Card className="py-12 text-center"><p className="font-medium">No submissions yet</p><p className="mt-1 text-sm text-ink-soft">Everything you upload will be listed here, including earlier versions.</p></Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-surface-line text-xs text-ink-soft"><tr>{["Assignment", "Document", "Submitted", "Version", "Status", "Marks"].map((h) => <th key={h} className="px-3 py-3 font-medium first:px-5">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-surface-line">
              {rows.map((r) => {
                // Marks only count once published. An unpublished evaluation only means "under evaluation".
                const status: UiStatus = r.status === "RETURNED" ? "RETURNED" : r.evaluation?.published ? "EVALUATED" : r.evaluation ? "UNDER_EVALUATION" : "SUBMITTED";
                const meta = STATUS_META[status];
                const marks = r.evaluation?.published && r.evaluation.marks !== null ? `${r.evaluation.marks} / ${r.assignment.maxMarks}` : "–";
                return (
                  <tr key={r.id}>
                    <td className="px-5 py-3"><Link href={`/student/assignments/${r.assignment.id}`} className="font-medium hover:text-accent">{r.assignment.title}</Link></td>
                    <td className="px-3 py-3">{r.files.map((f) => <a key={f.id} href={`/api/files/submissions/${f.id}`} className="flex items-center gap-1.5 text-accent hover:underline"><Download className="h-3.5 w-3.5 shrink-0" aria-hidden /><span className="max-w-[200px] truncate">{f.originalName}</span></a>)}</td>
                    <td className="px-3 py-3"><LocalTime iso={r.submittedAt.toISOString()} /> {r.isLate && <Badge tone="yellow">Late</Badge>}</td>
                    <td className="px-3 py-3">v{r.version}</td>
                    <td className="px-3 py-3"><Badge tone={meta.tone}>{meta.label}</Badge></td>
                    <td className="px-3 py-3">{marks}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
