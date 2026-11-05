import { db } from "@/lib/db";
import { sectionLabel } from "@/lib/labels";

// Classes this faculty member teaches, plus the students in them (for "selected students" assignments).
export async function facultyFormData(facultyId: string) {
  const rows = await db.facultySubject.findMany({
    where: { facultyId },
    include: { section: { include: { course: true, students: { include: { user: { select: { name: true } } } } } } },
  });
  return {
    subjects: rows.map((r) => ({ id: r.id, label: sectionLabel(r.section), sectionId: r.sectionId })),
    students: rows.flatMap((r) => r.section.students.map((s) => ({ id: s.id, name: s.user.name, regNo: s.regNo, sectionId: s.sectionId }))),
  };
}
