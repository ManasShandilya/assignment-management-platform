import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { apiHandler, HttpError } from "@/lib/errors";
import { requireStudent } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/rate-limit";
import { safeNotify } from "@/lib/notifications";
import { storage } from "@/lib/storage/provider";
import { SUBMISSION_FORMATS, validateFile, type FormatKey } from "@/lib/uploads";
import { visibleWhere } from "@/lib/student-assignments";
import { submissionGate } from "@/lib/submissions";

const MAX_FILES = 5;
const isFile = (v: FormDataEntryValue): v is File => typeof v !== "string" && v.size > 0;

export const POST = apiHandler<{ params: { id: string } }>(async (req, { params }) => {
  const { user, student } = await requireStudent();
  rateLimit(`submit:${student.id}`, 20, 10 * 60 * 1000);

  // The student id comes from the session, never from the request. The assignment must be one they may see.
  const assignment = await db.assignment.findFirst({ where: { id: params.id, ...visibleWhere(student) }, include: { faculty: { select: { userId: true } } } });
  if (!assignment) throw new HttpError(404, "Assignment not found");

  const latest = await db.submission.findFirst({ where: { assignmentId: assignment.id, studentId: student.id }, orderBy: { version: "desc" } });
  const submittedAt = new Date(); // server clock, recorded exactly once
  const gate = submissionGate(assignment, latest, submittedAt);
  if (!gate.ok) throw new HttpError(403, gate.reason);

  let form: FormData;
  try { form = await req.formData(); } catch { throw new HttpError(400, "Invalid upload"); }
  const files = form.getAll("files").filter(isFile);
  if (files.length === 0) throw new HttpError(400, "Choose a file to upload");
  if (files.length > (assignment.allowMultiple ? MAX_FILES : 1)) {
    throw new HttpError(400, assignment.allowMultiple ? `Upload at most ${MAX_FILES} files` : "This assignment takes one file");
  }

  const allowed = assignment.allowedFormats.filter((f): f is FormatKey => (SUBMISSION_FORMATS as readonly string[]).includes(f));
  const valid = await Promise.all(files.map((f) => validateFile(f, allowed, assignment.maxFileSizeMb * 1024 * 1024)));

  const version = (latest?.version ?? 0) + 1;
  const saved: string[] = [];
  try {
    const rows = [];
    for (const f of valid) {
      const key = `submissions/${assignment.id}/${student.id}/v${version}/${randomUUID()}${f.ext}`;
      await storage.save(key, f.buffer);
      saved.push(key);
      rows.push({ storageKey: key, originalName: f.originalName, mimeType: f.mime, sizeBytes: f.size });
    }
    const submission = await db.submission.create({
      data: { assignmentId: assignment.id, studentId: student.id, version, submittedAt, isLate: gate.isLate, files: { create: rows } },
    });
    const facultyType = version > 1 ? "RESUBMISSION" : gate.isLate ? "LATE_SUBMISSION" : "NEW_SUBMISSION";
    const what = version > 1 ? "resubmitted" : gate.isLate ? "submitted late" : "submitted";
    await safeNotify([assignment.faculty.userId], facultyType, `${user.name} ${what}: ${assignment.title}`, `/faculty/submissions/${submission.id}`);
    await safeNotify([user.id], "SUBMISSION_CONFIRMED", `Your submission for ${assignment.title} was received${gate.isLate ? " (late)" : ""}`, `/student/assignments/${assignment.id}`);
    return NextResponse.json({ id: submission.id, version, submittedAt: submittedAt.toISOString(), isLate: gate.isLate }, { status: 201 });
  } catch (e) {
    await Promise.all(saved.map((k) => storage.delete(k).catch(() => {})));
    // Two uploads racing for the same version: the unique constraint lets only one win.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new HttpError(409, "Another upload just finished. Refresh the page and check your submission.");
    throw e;
  }
});
