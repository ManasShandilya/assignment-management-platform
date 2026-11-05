import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { currentFaculty } from "@/lib/faculty";
import { sectionLabel } from "@/lib/labels";

export default async function StudentsPage({ searchParams }: { searchParams: { q?: string; section?: string } }) {
  const { faculty } = await currentFaculty();
  const q = searchParams.q?.trim() ?? "";
  const [subjects, assignments, subs] = await Promise.all([
    db.facultySubject.findMany({ where: { facultyId: faculty.id }, include: { section: { include: { course: true } } } }),
    db.assignment.findMany({ where: { facultyId: faculty.id, status: "PUBLISHED" }, select: { id: true, sectionId: true, visibility: true, targets: { select: { studentId: true } } } }),
    db.submission.findMany({ where: { assignment: { facultyId: faculty.id } }, select: { assignmentId: true, studentId: true }, distinct: ["assignmentId", "studentId"] }),
  ]);
  // Only students in sections this faculty member teaches are ever listed.
  const students = await db.student.findMany({
    where: {
      section: { subjects: { some: { facultyId: faculty.id } } }, sectionId: searchParams.section || undefined,
      ...(q ? { OR: [{ regNo: { contains: q, mode: "insensitive" } }, { user: { name: { contains: q, mode: "insensitive" } } }] } : {}),
    },
    include: { user: { select: { name: true } }, section: { include: { course: true } } }, orderBy: { regNo: "asc" },
  });
  const done = new Set(subs.map((s) => `${s.assignmentId}:${s.studentId}`));
  const rows = students.map((st) => {
    const expected = assignments.filter((a) => a.sectionId === st.sectionId && (a.visibility === "CLASS" || a.targets.some((t) => t.studentId === st.id)));
    const submitted = expected.filter((a) => done.has(`${a.id}:${st.id}`)).length;
    return { st, submitted, pending: expected.length - submitted };
  });
  const sel = "h-10 rounded-xl border border-surface-line bg-white px-3 text-sm";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Students</h1>
      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <input name="q" defaultValue={q} placeholder="Search name or registration number" aria-label="Search students" className={`${sel} flex-1`} />
        <select name="section" defaultValue={searchParams.section ?? ""} aria-label="Class" className={sel}>
          <option value="">All classes</option>{subjects.map((s) => <option key={s.sectionId} value={s.sectionId}>{sectionLabel(s.section)}</option>)}
        </select>
        <Button type="submit" variant="secondary">Apply filters</Button>
      </form>
      {rows.length === 0 ? (
        <Card className="py-12 text-center"><p className="font-medium">{q || searchParams.section ? "No students match" : "No students yet"}</p><p className="mt-1 text-sm text-ink-soft">{subjects.length === 0 ? "Add a class under My classes to see its students." : "Students appear once they register in one of your classes."}</p></Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-surface-line text-xs text-ink-soft"><tr>{["Student", "Reg. no.", "Class", "Submitted", "Pending", ""].map((h) => <th key={h} className="px-3 py-3 font-medium first:px-5">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-surface-line">
              {rows.map(({ st, submitted, pending }) => (
                <tr key={st.id}>
                  <td className="px-5 py-3 font-medium">{st.user.name}</td><td className="px-3 py-3">{st.regNo}</td>
                  <td className="px-3 py-3 text-xs text-ink-soft">{sectionLabel(st.section)}</td><td className="px-3 py-3">{submitted}</td><td className="px-3 py-3">{pending}</td>
                  <td className="px-3 py-3"><Link href={`/faculty/students/${st.id}`} className="font-medium text-accent hover:underline">View profile</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
