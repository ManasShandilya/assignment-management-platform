import { ClassManager } from "@/components/faculty/class-manager";
import { db } from "@/lib/db";
import { currentFaculty } from "@/lib/faculty";
import { sectionLabel } from "@/lib/labels";

export default async function ClassesPage() {
  const { faculty } = await currentFaculty();
  const [subjects, sections] = await Promise.all([
    db.facultySubject.findMany({ where: { facultyId: faculty.id }, include: { section: { include: { course: true } } } }),
    db.section.findMany({ include: { course: true }, orderBy: [{ course: { name: "asc" } }, { semester: "asc" }, { name: "asc" }] }),
  ]);
  const taken = new Set(subjects.map((s) => s.sectionId));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My classes</h1>
        <p className="mt-1 text-sm text-ink-soft">You can only create assignments and see submissions for classes listed here.</p>
      </div>
      <ClassManager
        mine={subjects.map((s) => ({ id: s.id, label: sectionLabel(s.section) }))}
        available={sections.filter((s) => !taken.has(s.id)).map((s) => ({ id: s.id, label: sectionLabel(s) }))}
      />
    </div>
  );
}
