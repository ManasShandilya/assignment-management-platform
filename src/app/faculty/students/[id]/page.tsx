import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LocalTime } from "@/components/ui/local-time";
import { db } from "@/lib/db";
import { currentFaculty } from "@/lib/faculty";
import { sectionLabel } from "@/lib/labels";

export default async function StudentProfilePage({ params }: { params: { id: string } }) {
  const { faculty } = await currentFaculty();
  // Only students in a class this faculty member teaches. Anyone else is a 404.
  const st = await db.student.findFirst({
    where: { id: params.id, section: { subjects: { some: { facultyId: faculty.id } } } },
    include: { user: { select: { name: true, email: true } }, section: { include: { course: true } } },
  });
  if (!st) notFound();
  const [assignments, subs] = await Promise.all([
    db.assignment.findMany({
      where: { facultyId: faculty.id, status: "PUBLISHED", sectionId: st.sectionId, OR: [{ visibility: "CLASS" }, { targets: { some: { studentId: st.id } } }] },
      select: { id: true, title: true, deadline: true, maxMarks: true }, orderBy: { deadline: "asc" },
    }),
    db.submission.findMany({
      where: { studentId: st.id, assignment: { facultyId: faculty.id } }, orderBy: { submittedAt: "desc" },
      include: { assignment: { select: { title: true, maxMarks: true } }, evaluation: { select: { marks: true, published: true } } },
    }),
  ]);
  const submittedIds = new Set(subs.map((s) => s.assignmentId));
  const pending = assignments.filter((a) => !submittedIds.has(a.id));
  const latestSeen = new Set<string>();
  const scores = subs.filter((s) => { if (latestSeen.has(s.assignmentId)) return false; latestSeen.add(s.assignmentId); return true; })
    .filter((s) => s.evaluation?.marks != null).map((s) => (s.evaluation!.marks! / s.assignment.maxMarks) * 100);
  const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
  const details = [["Registration number", st.regNo], ["Email", st.user.email], ["Course", st.program], ["Branch", st.branch], ["Semester", String(st.semester)], ["Section", st.section.name]];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/faculty/students" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden /> Students</Link>
      <div><h1 className="text-2xl font-semibold">{st.user.name}</h1><p className="mt-1 text-sm text-ink-soft">{sectionLabel(st.section)}</p></div>
      <Card>
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          {details.map(([k, v]) => <div key={k}><dt className="text-xs text-ink-soft">{k}</dt><dd className="font-medium">{v}</dd></div>)}
          <div><dt className="text-xs text-ink-soft">Average performance</dt><dd className="font-medium">{avg === null ? "–" : `${avg}%`}</dd></div>
        </dl>
      </Card>
      <Card className="p-0">
        <h2 className="border-b border-surface-line px-5 py-3 text-sm font-semibold">Pending assignments ({pending.length})</h2>
        {pending.length === 0 ? <p className="px-5 py-6 text-sm text-ink-soft">Nothing pending.</p> : (
          <ul className="divide-y divide-surface-line">{pending.map((a) => <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm"><span>{a.title}</span><span className="text-xs text-ink-soft">Due <LocalTime iso={a.deadline.toISOString()} /></span></li>)}</ul>
        )}
      </Card>
      <Card className="p-0">
        <h2 className="border-b border-surface-line px-5 py-3 text-sm font-semibold">Submission history</h2>
        {subs.length === 0 ? <p className="px-5 py-6 text-sm text-ink-soft">No submissions yet.</p> : (
          <ul className="divide-y divide-surface-line">
            {subs.map((s) => (
              <li key={s.id}><Link href={`/faculty/submissions/${s.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm hover:bg-surface-muted">
                <span>{s.assignment.title} <span className="text-xs text-ink-faint">v{s.version}</span></span>
                <span className="flex items-center gap-2 text-xs text-ink-soft"><LocalTime iso={s.submittedAt.toISOString()} /><Badge tone={s.isLate ? "yellow" : "green"}>{s.isLate ? "Late" : "On time"}</Badge>{s.evaluation?.marks != null && <span>{s.evaluation.marks}/{s.assignment.maxMarks}</span>}</span>
              </Link></li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
