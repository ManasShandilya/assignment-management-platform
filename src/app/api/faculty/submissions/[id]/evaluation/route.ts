import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiHandler, HttpError, readJson } from "@/lib/errors";
import { requireFaculty } from "@/lib/auth/guards";
import { safeNotify } from "@/lib/notifications";

const schema = z.object({
  action: z.enum(["save", "publish", "return", "unpublish"]),
  marks: z.number().min(0, "Marks can't be negative").nullable().optional(),
  feedback: z.string().trim().max(5000).default(""),
  remarks: z.string().trim().max(5000).default(""),
});

export const PUT = apiHandler<{ params: { id: string } }>(async (req, { params }) => {
  const { faculty } = await requireFaculty();
  const input = schema.parse(await readJson(req));

  // Scoped to this faculty member's own assignments. Anyone else's submission is a 404.
  const sub = await db.submission.findFirst({
    where: { id: params.id, assignment: { facultyId: faculty.id } },
    include: { assignment: { select: { id: true, title: true, maxMarks: true, latePenaltyPct: true } }, evaluation: true, student: { select: { userId: true } } },
  });
  if (!sub) throw new HttpError(404, "Submission not found");
  const newer = await db.submission.count({ where: { assignmentId: sub.assignmentId, studentId: sub.studentId, version: { gt: sub.version } } });
  if (newer > 0) throw new HttpError(409, "The student has uploaded a newer version. Evaluate that one instead.");

  const now = new Date();
  const evalWhere = { submissionId: sub.id };
  const link = `/student/assignments/${sub.assignment.id}`;
  const published = !!sub.evaluation?.published && sub.status !== "RETURNED";

  if (input.action === "unpublish") {
    if (!published) throw new HttpError(400, "There are no published marks to withdraw");
    await db.$transaction([
      db.evaluation.update({ where: evalWhere, data: { published: false, publishedAt: null } }),
      db.submission.update({ where: { id: sub.id }, data: { status: "SUBMITTED" } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (sub.status === "RETURNED") throw new HttpError(409, "This submission was returned. Wait for the student's corrected version.");

  if (input.action === "return") {
    if (!input.feedback) throw new HttpError(400, "Tell the student what to correct", { feedback: "Add feedback explaining what to fix" });
    if (published) throw new HttpError(409, "Withdraw the published marks before returning this submission.");
    const data = { marks: null, rawMarks: null, penaltyPct: 0, feedback: input.feedback, remarks: input.remarks, published: true, evaluatedAt: now, publishedAt: now };
    await db.$transaction([
      db.evaluation.upsert({ where: evalWhere, create: { submissionId: sub.id, ...data }, update: data }),
      db.submission.update({ where: { id: sub.id }, data: { status: "RETURNED" } }),
    ]);
    await safeNotify([sub.student.userId], "SUBMISSION_RETURNED", `${sub.assignment.title} was returned for correction`, link);
    return NextResponse.json({ ok: true });
  }

  // save or publish
  const raw = input.marks;
  if (raw === null || raw === undefined) throw new HttpError(400, "Enter the marks", { marks: "Enter the marks" });
  const max = sub.assignment.maxMarks;
  if (raw > max) throw new HttpError(400, `Marks can't exceed ${max}`, { marks: `Marks can't exceed ${max}` });
  // The late penalty is applied here, on the server, from the assignment's own setting.
  const penaltyPct = sub.isLate ? sub.assignment.latePenaltyPct : 0;
  const final = Math.round(raw * (100 - penaltyPct)) / 100;
  const publish = input.action === "publish";
  const data = {
    marks: final, rawMarks: raw, penaltyPct, feedback: input.feedback, remarks: input.remarks,
    published: publish, evaluatedAt: now, publishedAt: publish ? now : null,
  };
  await db.$transaction([
    db.evaluation.upsert({ where: evalWhere, create: { submissionId: sub.id, ...data }, update: data }),
    db.submission.update({ where: { id: sub.id }, data: { status: publish ? "EVALUATED" : "SUBMITTED" } }),
  ]);
  if (publish) {
    await safeNotify([sub.student.userId], "MARKS_PUBLISHED", `Marks published for ${sub.assignment.title}`, "/student/results");
    if (input.feedback) await safeNotify([sub.student.userId], "FEEDBACK_RECEIVED", `New feedback on ${sub.assignment.title}`, "/student/results");
  }
  return NextResponse.json({ ok: true, marks: final });
});
