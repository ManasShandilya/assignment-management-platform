import Link from "next/link";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { Card } from "@/components/ui/card";
import { currentFaculty } from "@/lib/faculty";
import { facultyFormData } from "@/lib/form-data";

export default async function NewAssignmentPage() {
  const { faculty } = await currentFaculty();
  const { subjects, students } = await facultyFormData(faculty.id);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Create assignment</h1>
      {subjects.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-soft">Add the classes you teach before creating an assignment.</p>
          <Link href="/faculty/classes" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">Go to My classes</Link>
        </Card>
      ) : <AssignmentForm subjects={subjects} students={students} />}
    </div>
  );
}
