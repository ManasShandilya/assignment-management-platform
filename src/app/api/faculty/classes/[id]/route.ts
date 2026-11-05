import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler, HttpError } from "@/lib/errors";
import { requireFaculty } from "@/lib/auth/guards";

export const DELETE = apiHandler<{ params: { id: string } }>(async (_req, { params }) => {
  const { faculty } = await requireFaculty();
  const subject = await db.facultySubject.findFirst({ where: { id: params.id, facultyId: faculty.id } });
  if (!subject) throw new HttpError(404, "Class not found");
  const inUse = await db.assignment.count({ where: { facultyId: faculty.id, courseId: subject.courseId, sectionId: subject.sectionId } });
  if (inUse > 0) throw new HttpError(409, "This class has assignments. Delete them first to remove the class.");
  await db.facultySubject.delete({ where: { id: subject.id } });
  return NextResponse.json({ ok: true });
});
