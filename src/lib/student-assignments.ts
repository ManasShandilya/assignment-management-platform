import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { Tone } from "@/components/ui/badge";

export type UiStatus = "NOT_STARTED" | "DUE_SOON" | "OVERDUE" | "SUBMITTED" | "UNDER_EVALUATION" | "EVALUATED" | "RETURNED";

export const STATUS_META: Record<UiStatus, { label: string; tone: Tone }> = {
  NOT_STARTED: { label: "Not started", tone: "gray" },
  DUE_SOON: { label: "Due soon", tone: "yellow" },
  OVERDUE: { label: "Overdue", tone: "red" },
  SUBMITTED: { label: "Submitted", tone: "green" },
  UNDER_EVALUATION: { label: "Under evaluation", tone: "blue" },
  EVALUATED: { label: "Evaluated", tone: "green" },
  RETURNED: { label: "Returned for correction", tone: "yellow" },
};

export const FILTERS = {
  all: { label: "All", statuses: null },
  pending: { label: "Pending", statuses: ["NOT_STARTED", "DUE_SOON", "OVERDUE", "RETURNED"] },
  submitted: { label: "Submitted", statuses: ["SUBMITTED", "UNDER_EVALUATION"] },
  evaluated: { label: "Evaluated", statuses: ["EVALUATED"] },
  overdue: { label: "Overdue", statuses: ["OVERDUE"] },
} as const;
export type FilterKey = keyof typeof FILTERS;

// The one definition of "which assignments may this student see".
// Published, in the student's own section, and either class-wide or aimed at this student.
export const visibleWhere = (student: { id: string; sectionId: string }): Prisma.AssignmentWhereInput => ({
  status: "PUBLISHED",
  sectionId: student.sectionId,
  OR: [{ visibility: "CLASS" }, { targets: { some: { studentId: student.id } } }],
});

function deriveStatus(deadline: Date, sub: { status: string; evaluation: { published: boolean } | null } | undefined, now: Date): UiStatus {
  if (sub) {
    if (sub.status === "RETURNED") return "RETURNED";
    if (sub.evaluation?.published) return "EVALUATED";
    if (sub.evaluation) return "UNDER_EVALUATION";
    return "SUBMITTED";
  }
  if (deadline < now) return "OVERDUE";
  if (deadline.getTime() - now.getTime() < 48 * 3600 * 1000) return "DUE_SOON";
  return "NOT_STARTED";
}

export interface StudentAssignment {
  id: string; title: string; description: string; deadline: string; createdAt: string; maxMarks: number;
  courseName: string; facultyName: string; status: UiStatus; submittedAt: string | null; isLate: boolean;
  // Present only once the faculty has published it. Unpublished marks never leave this file.
  result: { marks: number | null; feedback: string | null; evaluatedAt: string; penaltyPct: number } | null;
}

export async function loadStudentAssignments(student: { id: string; sectionId: string }): Promise<StudentAssignment[]> {
  const now = new Date();
  const rows = await db.assignment.findMany({
    where: visibleWhere(student),
    include: {
      course: { select: { name: true } },
      faculty: { select: { user: { select: { name: true } } } },
      submissions: {
        where: { studentId: student.id }, orderBy: { version: "desc" }, take: 1,
        include: { evaluation: { select: { published: true, marks: true, feedback: true, evaluatedAt: true, publishedAt: true, penaltyPct: true } } },
      },
    },
  });
  const items = rows.map((a): StudentAssignment => {
    const sub = a.submissions[0];
    const ev = sub?.evaluation;
    return {
      id: a.id, title: a.title, description: a.description, deadline: a.deadline.toISOString(), createdAt: a.createdAt.toISOString(),
      maxMarks: a.maxMarks, courseName: a.course.name, facultyName: a.faculty.user.name,
      status: deriveStatus(a.deadline, sub, now), submittedAt: sub?.submittedAt.toISOString() ?? null, isLate: sub?.isLate ?? false,
      result: ev?.published ? { marks: ev.marks, feedback: ev.feedback, evaluatedAt: (ev.publishedAt ?? ev.evaluatedAt).toISOString(), penaltyPct: ev.penaltyPct } : null,
    };
  });
  const open = (s: UiStatus) => (FILTERS.pending.statuses as readonly string[]).includes(s);
  // Open work first, soonest deadline on top; finished work after, newest first.
  return items.sort((a, b) => {
    if (open(a.status) !== open(b.status)) return open(a.status) ? -1 : 1;
    const d = a.deadline.localeCompare(b.deadline);
    return open(a.status) ? d : -d;
  });
}

export const countBy = (items: StudentAssignment[], key: FilterKey) =>
  FILTERS[key].statuses ? items.filter((i) => (FILTERS[key].statuses as readonly string[]).includes(i.status)).length : items.length;
