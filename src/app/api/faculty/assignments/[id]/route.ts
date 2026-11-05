import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler, HttpError, readJson } from "@/lib/errors";
import { requireFaculty } from "@/lib/auth/guards";
import { assignmentFields, parseAssignmentRequest, storeAttachments, validateTargets } from "@/lib/assignments";
import { notifyNewAssignment } from "@/lib/notifications";
import { storage } from "@/lib/storage/provider";
import { statusSchema } from "@/lib/validation/assignment";

type Ctx = { params: { id: string } };

// Every query is scoped by facultyId, so another faculty member's assignment looks like it doesn't exist.
async function findOwned(id: string, facultyId: string) {
  const a = await db.assignment.findFirst({
    where: { id, facultyId },
    include: { attachments: true, _count: { select: { submissions: true } } },
  });
  if (!a) throw new HttpError(404, "Assignment not found");
  return a;
}

export const PUT = apiHandler<Ctx>(async (req, { params }) => {
  const { faculty } = await requireFaculty();
  const existing = await findOwned(params.id, faculty.id);
  const { data, files } = await parseAssignmentRequest(req);

  const subject = await db.facultySubject.findFirst({ where: { id: data.subjectId, facultyId: faculty.id } });
  if (!subject) throw new HttpError(403, "You can only use your own classes");
  if (existing._count.submissions > 0 && subject.sectionId !== existing.sectionId) {
    throw new HttpError(409, "This assignment already has submissions, so its class can't change");
  }
  const targetIds = await validateTargets(data, subject.sectionId);
  const removed = existing.attachments.filter((a) => data.removeAttachmentIds.includes(a.id));

  await db.$transaction([
    db.assignmentTarget.deleteMany({ where: { assignmentId: existing.id } }),
    db.assignmentAttachment.deleteMany({ where: { id: { in: removed.map((a) => a.id) }, assignmentId: existing.id } }),
    db.assignment.update({
      where: { id: existing.id },
      data: {
        ...assignmentFields(data), courseId: subject.courseId, sectionId: subject.sectionId,
        targets: { create: targetIds.map((studentId) => ({ studentId })) },
      },
    }),
  ]);
  await storeAttachments(existing.id, files);
  await Promise.all(removed.map((a) => storage.delete(a.storageKey).catch(() => {})));
  return NextResponse.json({ ok: true });
});

// Publish / unpublish.
export const PATCH = apiHandler<Ctx>(async (req, { params }) => {
  const { faculty } = await requireFaculty();
  const { status } = statusSchema.parse(await readJson(req));
  const existing = await findOwned(params.id, faculty.id);
  await db.assignment.update({ where: { id: existing.id }, data: { status } });
  if (status === "PUBLISHED") await notifyNewAssignment(existing.id).catch((e) => console.error("notify failed", e));
  return NextResponse.json({ ok: true });
});

export const DELETE = apiHandler<Ctx>(async (_req, { params }) => {
  const { faculty } = await requireFaculty();
  const existing = await findOwned(params.id, faculty.id);
  const submissionFiles = await db.submissionFile.findMany({
    where: { submission: { assignmentId: existing.id } }, select: { storageKey: true },
  });
  await db.assignment.delete({ where: { id: existing.id } });
  const keys = [...existing.attachments.map((a) => a.storageKey), ...submissionFiles.map((f) => f.storageKey)];
  await Promise.all(keys.map((k) => storage.delete(k).catch(() => {})));
  return NextResponse.json({ ok: true });
});
