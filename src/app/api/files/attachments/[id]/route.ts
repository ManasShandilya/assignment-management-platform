import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { apiHandler, HttpError } from "@/lib/errors";
import { streamFile } from "@/lib/files";
import { visibleWhere } from "@/lib/student-assignments";

// Not allowed looks exactly like not found, so file ids can't be probed.
export const GET = apiHandler<{ params: { id: string } }>(async (req, { params }) => {
  const user = await requireUser();
  const att = await db.assignmentAttachment.findUnique({ where: { id: params.id }, include: { assignment: { select: { facultyId: true } } } });
  let allowed = false;
  if (att) {
    if (user.role === "FACULTY") {
      const f = await db.faculty.findUnique({ where: { userId: user.id } });
      allowed = !!f && att.assignment.facultyId === f.id;
    } else {
      const s = await db.student.findUnique({ where: { userId: user.id } });
      allowed = !!s && !!(await db.assignment.findFirst({ where: { id: att.assignmentId, ...visibleWhere(s) }, select: { id: true } }));
    }
  }
  if (!att || !allowed) throw new HttpError(404, "File not found");
  return streamFile(req, att);
});
