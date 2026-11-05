import type { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";

export async function notify(userIds: string[], type: NotificationType, message: string, link?: string) {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return;
  await db.notification.createMany({ data: ids.map((userId) => ({ userId, type, message, link })) });
}
// A failed notification must never break the action that triggered it.
export const safeNotify = (...args: Parameters<typeof notify>) => notify(...args).catch((e) => console.error("notify failed", e));

// Tells the right students about a newly published assignment, once per student.
export async function notifyNewAssignment(assignmentId: string) {
  const a = await db.assignment.findUnique({
    where: { id: assignmentId },
    select: { title: true, sectionId: true, visibility: true, targets: { select: { studentId: true } }, course: { select: { name: true } } },
  });
  if (!a) return;
  const students = await db.student.findMany({
    where: { sectionId: a.sectionId, ...(a.visibility === "INDIVIDUAL" ? { id: { in: a.targets.map((t) => t.studentId) } } : {}) },
    select: { userId: true },
  });
  await remindOnce(students.map((s) => s.userId), "NEW_ASSIGNMENT", `/student/assignments/${assignmentId}`, `New assignment: ${a.title} (${a.course.name})`);
}

async function remindOnce(userIds: string[], type: NotificationType, link: string, message: string) {
  if (userIds.length === 0) return;
  const existing = await db.notification.findMany({ where: { type, link, userId: { in: userIds } }, select: { userId: true } });
  const skip = new Set(existing.map((e) => e.userId));
  await notify(userIds.filter((u) => !skip.has(u)), type, message, link);
}

// There is no scheduler, so reminders are generated lazily whenever a user's bell refreshes (at most every 5 minutes per server).
let lastRun = 0;
export async function generateDeadlineReminders() {
  if (Date.now() - lastRun < 5 * 60 * 1000) return;
  lastRun = Date.now();
  const now = new Date();
  const due = await db.assignment.findMany({
    where: { status: "PUBLISHED", deadline: { gt: now, lte: new Date(now.getTime() + 24 * 3600 * 1000) } },
    select: {
      id: true, title: true, sectionId: true, visibility: true, faculty: { select: { userId: true } },
      targets: { select: { studentId: true } }, submissions: { select: { studentId: true } },
    },
  });
  for (const a of due) {
    const submitted = new Set(a.submissions.map((s) => s.studentId));
    const students = await db.student.findMany({
      where: { sectionId: a.sectionId, ...(a.visibility === "INDIVIDUAL" ? { id: { in: a.targets.map((t) => t.studentId) } } : {}) },
      select: { id: true, userId: true },
    });
    await remindOnce(students.filter((s) => !submitted.has(s.id)).map((s) => s.userId), "DEADLINE_APPROACHING", `/student/assignments/${a.id}`, `Due within 24 hours: ${a.title}`);
    await remindOnce([a.faculty.userId], "DEADLINE_APPROACHING", `/faculty/submissions?assignment=${a.id}`, `Deadline within 24 hours: ${a.title}`);
  }
}
