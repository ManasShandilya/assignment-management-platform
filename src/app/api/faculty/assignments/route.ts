import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler, HttpError } from "@/lib/errors";
import { requireFaculty } from "@/lib/auth/guards";
import { notifyNewAssignment } from "@/lib/notifications";
import { assignmentFields, parseAssignmentRequest, storeAttachments, validateTargets } from "@/lib/assignments";

export const POST = apiHandler(async (req) => {
  const { faculty } = await requireFaculty();
  const { data, files } = await parseAssignmentRequest(req);

  if (new Date(data.deadline) <= new Date()) throw new HttpError(400, "Choose a deadline in the future", { deadline: "Choose a deadline in the future" });
  // Ownership: the class must be one this faculty member has claimed.
  const subject = await db.facultySubject.findFirst({ where: { id: data.subjectId, facultyId: faculty.id } });
  if (!subject) throw new HttpError(403, "You can only create assignments for your own classes");
  const targetIds = await validateTargets(data, subject.sectionId);

  const assignment = await db.assignment.create({
    data: {
      ...assignmentFields(data), facultyId: faculty.id, courseId: subject.courseId, sectionId: subject.sectionId,
      targets: { create: targetIds.map((studentId) => ({ studentId })) },
    },
  });
  try {
    await storeAttachments(assignment.id, files);
  } catch (e) {
    await db.assignment.delete({ where: { id: assignment.id } });
    throw e;
  }
  if (assignment.status === "PUBLISHED") await notifyNewAssignment(assignment.id).catch((e) => console.error("notify failed", e));
  return NextResponse.json({ id: assignment.id }, { status: 201 });
});
