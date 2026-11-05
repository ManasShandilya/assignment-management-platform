import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AvatarUploader, PasswordForm, ProfileForm } from "@/components/profile/profile-forms";
import { db } from "@/lib/db";
import { currentFaculty } from "@/lib/faculty";
import { sectionLabel } from "@/lib/labels";

export default async function FacultyProfilePage() {
  const { user, faculty } = await currentFaculty();
  const subjects = await db.facultySubject.findMany({ where: { facultyId: faculty.id }, include: { section: { include: { course: true } } } });
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <Card className="space-y-6">
        <AvatarUploader name={user.name} hasAvatar={!!user.avatarPath} version={Date.now()} />
        <dl className="text-sm"><dt className="text-xs text-ink-soft">Faculty ID</dt><dd className="font-medium">{faculty.facultyCode}</dd></dl>
        <ProfileForm fields={[
          { name: "name", label: "Full name", value: user.name }, { name: "email", label: "Email", value: user.email },
          { name: "department", label: "Department", value: faculty.department }, { name: "designation", label: "Designation", value: faculty.designation },
        ]} />
        <div>
          <h2 className="text-sm font-semibold">Assigned subjects</h2>
          {subjects.length === 0 ? <p className="mt-1 text-sm text-ink-soft">None yet.</p> : <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-soft">{subjects.map((s) => <li key={s.id}>{sectionLabel(s.section)}</li>)}</ul>}
          <Link href="/faculty/classes" className="mt-2 inline-block text-sm text-accent hover:underline">Manage my classes</Link>
        </div>
      </Card>
      <PasswordForm />
    </div>
  );
}
