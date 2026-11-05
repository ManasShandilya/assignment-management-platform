import { notFound } from "next/navigation";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { db } from "@/lib/db";
import { currentFaculty } from "@/lib/faculty";
import { facultyFormData } from "@/lib/form-data";

export default async function EditAssignmentPage({ params }: { params: { id: string } }) {
  const { faculty } = await currentFaculty();
  // Scoped by facultyId: someone else's assignment is a 404, not a 403.
  const a = await db.assignment.findFirst({
    where: { id: params.id, facultyId: faculty.id },
    include: { attachments: true, targets: true },
  });
  if (!a) notFound();
  const { subjects, students } = await facultyFormData(faculty.id);
  const subject = subjects.find((s) => s.sectionId === a.sectionId);
  if (!subject) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit assignment</h1>
      <AssignmentForm subjects={subjects} students={students} initial={{
        id: a.id, subjectId: subject.id, title: a.title, description: a.description, instructions: a.instructions ?? "",
        deadline: a.deadline.toISOString(), maxMarks: a.maxMarks, allowedFormats: a.allowedFormats, maxFileSizeMb: a.maxFileSizeMb,
        allowMultiple: a.allowMultiple, allowResubmission: a.allowResubmission, allowLate: a.allowLate, latePenaltyPct: a.latePenaltyPct,
        visibility: a.visibility, studentIds: a.targets.map((t) => t.studentId), status: a.status,
        attachments: a.attachments.map((x) => ({ id: x.id, originalName: x.originalName, isReference: x.isReference })),
      }} />
    </div>
  );
}
