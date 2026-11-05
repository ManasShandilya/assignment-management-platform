import { Card } from "@/components/ui/card";
import { AvatarUploader, PasswordForm, ProfileForm } from "@/components/profile/profile-forms";
import { db } from "@/lib/db";
import { currentStudent } from "@/lib/student";

export default async function StudentProfilePage() {
  const { user, student } = await currentStudent();
  const section = await db.section.findUniqueOrThrow({ where: { id: student.sectionId }, select: { name: true } });
  const fixed = [["Registration number", student.regNo], ["Course", student.program], ["Semester", String(student.semester)], ["Section", section.name]];
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <Card className="space-y-6">
        <AvatarUploader name={user.name} hasAvatar={!!user.avatarPath} version={Date.now()} />
        <dl className="grid gap-4 text-sm sm:grid-cols-2">{fixed.map(([k, v]) => <div key={k}><dt className="text-xs text-ink-soft">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
        <ProfileForm fields={[{ name: "name", label: "Full name", value: user.name }, { name: "email", label: "Email", value: user.email }, { name: "branch", label: "Branch", value: student.branch }]} />
      </Card>
      <PasswordForm />
    </div>
  );
}
