import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { apiHandler, HttpError } from "@/lib/errors";
import { streamFile } from "@/lib/files";

// A submitted file is readable by the student who uploaded it and by the faculty who owns the assignment. Nobody else.
export const GET = apiHandler<{ params: { id: string } }>(async (req, { params }) => {
  const user = await requireUser();
  const file = await db.submissionFile.findUnique({
    where: { id: params.id },
    include: { submission: { select: { studentId: true, assignment: { select: { facultyId: true } } } } },
  });
  let allowed = false;
  if (file) {
    if (user.role === "STUDENT") {
      const s = await db.student.findUnique({ where: { userId: user.id } });
      allowed = !!s && file.submission.studentId === s.id;
    } else {
      const f = await db.faculty.findUnique({ where: { userId: user.id } });
      allowed = !!f && file.submission.assignment.facultyId === f.id;
    }
  }
  if (!file || !allowed) throw new HttpError(404, "File not found");
  return streamFile(req, file);
});
