import type { SubmissionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { visibleWhere } from "@/lib/student-assignments";

type Rules = { deadline: Date; allowLate: boolean; allowResubmission: boolean };
type Latest = { status: SubmissionStatus; isLate: boolean } | null;
export type Gate = { ok: true; isLate: boolean; resubmit: boolean } | { ok: false; reason: string };

// The single source of truth for "may this student submit now?". The API enforces it; the pages only display it.
export function submissionGate(a: Rules, latest: Latest, now: Date): Gate {
  if (latest) {
    if (latest.status === "RETURNED") return { ok: true, isLate: latest.isLate, resubmit: true }; // faculty asked for a fix
    if (latest.status === "EVALUATED") return { ok: false, reason: "This assignment has been evaluated, so it can't be resubmitted." };
    if (!a.allowResubmission) return { ok: false, reason: "You've already submitted, and resubmission isn't allowed for this assignment." };
  }
  const late = now > a.deadline;
  if (late && !a.allowLate) return { ok: false, reason: "The deadline has passed and late submissions aren't accepted." };
  return { ok: true, isLate: late, resubmit: !!latest };
}

export interface SubmitPanelProps {
  assignmentId: string; formats: string[]; maxMb: number; allowMultiple: boolean;
  deadline: string; resubmit: boolean; willBeLate: boolean; blockedReason: string | null;
}

export function panelPropsFor(
  a: Rules & { id: string; allowedFormats: string[]; maxFileSizeMb: number; allowMultiple: boolean },
  latest: Latest, now: Date,
): SubmitPanelProps {
  const gate = submissionGate(a, latest, now);
  return {
    assignmentId: a.id, formats: a.allowedFormats, maxMb: a.maxFileSizeMb, allowMultiple: a.allowMultiple,
    deadline: a.deadline.toISOString(), resubmit: gate.ok && gate.resubmit, willBeLate: gate.ok && gate.isLate,
    blockedReason: gate.ok ? null : gate.reason,
  };
}

// Assignments this student can submit to right now, soonest deadline first.
export async function loadSubmittable(student: { id: string; sectionId: string }) {
  const now = new Date();
  const rows = await db.assignment.findMany({
    where: visibleWhere(student),
    include: { course: { select: { name: true } }, submissions: { where: { studentId: student.id }, orderBy: { version: "desc" }, take: 1 } },
    orderBy: { deadline: "asc" },
  });
  return rows.filter((a) => submissionGate(a, a.submissions[0] ?? null, now).ok)
    .map((a) => ({ assignment: a, panel: panelPropsFor(a, a.submissions[0] ?? null, now) }));
}
