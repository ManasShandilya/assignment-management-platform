import Link from "next/link";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LocalTime } from "@/components/ui/local-time";
import { db } from "@/lib/db";
import { currentFaculty } from "@/lib/faculty";
import { sectionLabel } from "@/lib/labels";
import { humanDuration } from "@/lib/time";

const PAGE = 25;
const EVAL: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "Awaiting evaluation", tone: "yellow" },
  DRAFT: { label: "Draft saved", tone: "blue" },
  EVALUATED: { label: "Evaluated", tone: "green" },
  RETURNED: { label: "Returned", tone: "gray" },
};
const STATUS_FILTERS: Record<string, string> = {
  ontime: "On time", late: "Late", pending: "Awaiting evaluation", draft: "Draft saved", evaluated: "Evaluated", returned: "Returned",
};

type SP = { q?: string; course?: string; section?: string; assignment?: string; status?: string; page?: string };

export default async function SubmissionsPage({ searchParams }: { searchParams: SP }) {
  const { faculty } = await currentFaculty();
  const q = searchParams.q?.trim() ?? "";
  const [subjects, mine] = await Promise.all([
    db.facultySubject.findMany({ where: { facultyId: faculty.id }, include: { course: true, section: { include: { course: true } } } }),
    db.assignment.findMany({ where: { facultyId: faculty.id }, select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const courses = [...new Map(subjects.map((s) => [s.course.id, s.course.name])).entries()];
  const sections = [...new Map(subjects.map((s) => [s.section.id, sectionLabel(s.section)])).entries()];

  // Always scoped to this faculty member; the filters only narrow it further.
  const all = await db.submission.findMany({
    where: {
      assignment: {
        facultyId: faculty.id,
        courseId: searchParams.course || undefined, sectionId: searchParams.section || undefined, id: searchParams.assignment || undefined,
      },
      student: q ? { OR: [{ regNo: { contains: q, mode: "insensitive" } }, { user: { name: { contains: q, mode: "insensitive" } } }] } : undefined,
    },
    orderBy: { submittedAt: "desc" },
    include: {
      student: { select: { regNo: true, user: { select: { name: true } } } },
      assignment: { select: { title: true, deadline: true } },
      files: { select: { originalName: true } },
      evaluation: { select: { marks: true, published: true } },
    },
  });

  // Newest version per student per assignment (the list is already newest first).
  const seen = new Set<string>();
  const latest = all.filter((r) => { const k = `${r.assignmentId}:${r.studentId}`; if (seen.has(k)) return false; seen.add(k); return true; });
  const rows = latest.map((r) => ({
    r, state: r.status === "RETURNED" ? "RETURNED" : r.evaluation?.published ? "EVALUATED" : r.evaluation ? "DRAFT" : "PENDING",
  })).filter(({ r, state }) => {
    const f = searchParams.status;
    if (f === "ontime") return !r.isLate;
    if (f === "late") return r.isLate;
    return !f || !(f in STATUS_FILTERS) || state === f.toUpperCase();
  });

  const page = Math.max(1, Number(searchParams.page) || 1);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice((page - 1) * PAGE, page * PAGE);
  const filtered = Object.entries(searchParams).some(([k, v]) => k !== "page" && v);
  const href = (n: number) => `/faculty/submissions?${new URLSearchParams({ ...(Object.fromEntries(Object.entries(searchParams).filter(([, v]) => v)) as Record<string, string>), page: String(n) })}`;
  const sel = "h-10 rounded-xl border border-surface-line bg-white px-3 text-sm";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Submissions</h1>
      <form method="get" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <input name="q" defaultValue={q} placeholder="Search name or registration number" aria-label="Search students" className={`${sel} sm:col-span-2 lg:col-span-3`} />
        <select name="course" defaultValue={searchParams.course ?? ""} aria-label="Subject" className={sel}><option value="">All subjects</option>{courses.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>
        <select name="section" defaultValue={searchParams.section ?? ""} aria-label="Class" className={sel}><option value="">All classes</option>{sections.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>
        <select name="assignment" defaultValue={searchParams.assignment ?? ""} aria-label="Assignment" className={sel}><option value="">All assignments</option>{mine.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select>
        <select name="status" defaultValue={searchParams.status ?? ""} aria-label="Status" className={sel}><option value="">All statuses</option>{Object.entries(STATUS_FILTERS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <div className="flex gap-2"><Button type="submit" variant="secondary">Apply filters</Button>{filtered && <Link href="/faculty/submissions"><Button type="button" variant="ghost">Clear</Button></Link>}</div>
      </form>

      {rows.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="font-medium">{filtered ? "No submissions match these filters" : "No submissions yet"}</p>
          <p className="mt-1 text-sm text-ink-soft">{filtered ? "Try a different search or clear the filters." : "Submissions appear here as students upload their work."}</p>
        </Card>
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-surface-line text-xs text-ink-soft">
                <tr>{["Student", "Reg. no.", "Assignment", "Timing", "Submitted", "Type", "Marks", "Evaluation", ""].map((h) => <th key={h} className="px-3 py-3 font-medium first:px-5">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-surface-line">
                {shown.map(({ r, state }) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-medium">{r.student.user.name}</td>
                    <td className="px-3 py-3">{r.student.regNo}</td>
                    <td className="px-3 py-3">{r.assignment.title}{r.version > 1 && <span className="ml-1 text-xs text-ink-faint">v{r.version}</span>}</td>
                    <td className="px-3 py-3"><Badge tone={r.isLate ? "yellow" : "green"}>{r.isLate ? "Late" : "On time"}</Badge>{r.isLate && <p className="mt-0.5 text-xs text-ink-soft">{humanDuration(r.submittedAt.getTime() - r.assignment.deadline.getTime())} after</p>}</td>
                    <td className="px-3 py-3"><LocalTime iso={r.submittedAt.toISOString()} /></td>
                    <td className="px-3 py-3">{[...new Set(r.files.map((f) => f.originalName.split(".").pop()?.toUpperCase()))].join(", ")}</td>
                    <td className="px-3 py-3">{r.evaluation?.marks ?? "–"}{state === "DRAFT" && <span className="ml-1 text-xs text-ink-faint">(draft)</span>}</td>
                    <td className="px-3 py-3"><Badge tone={EVAL[state].tone}>{EVAL[state].label}</Badge></td>
                    <td className="px-3 py-3"><Link href={`/faculty/submissions/${r.id}`} className="font-medium text-accent hover:underline">Review</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <nav aria-label="Pages" className="flex items-center justify-between text-sm text-ink-soft">
            <span>{rows.length} submission{rows.length === 1 ? "" : "s"} · page {page} of {pages}</span>
            <span className="flex gap-2">
              {page > 1 && <Link href={href(page - 1)} className="rounded-lg border border-surface-line bg-white px-3 py-1.5 hover:text-ink">Previous</Link>}
              {page < pages && <Link href={href(page + 1)} className="rounded-lg border border-surface-line bg-white px-3 py-1.5 hover:text-ink">Next</Link>}
            </span>
          </nav>
        </>
      )}
    </div>
  );
}
