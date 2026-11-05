import { db } from "@/lib/db";

const round1 = (n: number) => Math.round(n * 10) / 10;

// Everything the faculty overview, analytics and calendar need, computed from the faculty member's own data only.
export async function loadFacultyStats(facultyId: string) {
  const now = new Date();
  const [assignments, totalStudents] = await Promise.all([
    db.assignment.findMany({
      where: { facultyId },
      select: { id: true, title: true, status: true, deadline: true, createdAt: true, sectionId: true, visibility: true, _count: { select: { targets: true } } },
    }),
    db.student.count({ where: { section: { subjects: { some: { facultyId } } } } }),
  ]);
  const published = assignments.filter((a) => a.status === "PUBLISHED");
  const sizes = await db.student.groupBy({ by: ["sectionId"], where: { sectionId: { in: [...new Set(published.map((a) => a.sectionId))] } }, _count: { _all: true } });
  const sectionSize = new Map(sizes.map((s) => [s.sectionId, s._count._all]));

  const subs = await db.submission.findMany({
    where: { assignment: { facultyId, status: "PUBLISHED" } }, orderBy: { submittedAt: "desc" },
    include: {
      evaluation: { select: { marks: true } },
      student: { select: { id: true, user: { select: { name: true } } } },
      assignment: { select: { title: true, maxMarks: true } },
    },
  });
  const seen = new Set<string>();
  const latest = subs.filter((s) => { const k = `${s.assignmentId}:${s.studentId}`; if (seen.has(k)) return false; seen.add(k); return true; });

  const expectedFor = (a: (typeof published)[number]) => (a.visibility === "INDIVIDUAL" ? a._count.targets : sectionSize.get(a.sectionId) ?? 0);
  const pct = (s: (typeof latest)[number]) => (s.evaluation?.marks != null ? (s.evaluation.marks / s.assignment.maxMarks) * 100 : null);

  const perAssignment = published.map((a) => {
    const mine = latest.filter((s) => s.assignmentId === a.id);
    const expected = expectedFor(a);
    const marks = mine.map(pct).filter((x): x is number => x !== null);
    return {
      id: a.id, title: a.title, deadline: a.deadline, expected, submitted: mine.length,
      late: mine.filter((s) => s.isLate).length, onTime: mine.filter((s) => !s.isLate).length,
      pendingEval: mine.filter((s) => !s.evaluation && s.status === "SUBMITTED").length,
      avgPct: marks.length ? round1(marks.reduce((x, y) => x + y, 0) / marks.length) : null,
      completionPct: expected ? Math.min(100, Math.round((mine.length / expected) * 100)) : 0,
    };
  });

  const allPct = latest.map(pct).filter((x): x is number => x !== null);
  const expectedTotal = perAssignment.reduce((n, a) => n + a.expected, 0);
  const late = latest.filter((s) => s.isLate).length;

  const byStudent = new Map<string, { name: string; sum: number; n: number }>();
  for (const s of latest) {
    const p = pct(s);
    if (p === null) continue;
    const e = byStudent.get(s.student.id) ?? { name: s.student.user.name, sum: 0, n: 0 };
    e.sum += p; e.n += 1; byStudent.set(s.student.id, e);
  }

  return {
    totalStudents, totalAssignments: assignments.length,
    active: published.filter((a) => a.deadline > now).length,
    completed: latest.length, pending: Math.max(0, expectedTotal - latest.length), late, onTime: latest.length - late,
    pendingEval: latest.filter((s) => !s.evaluation && s.status === "SUBMITTED").length,
    avgPct: allPct.length ? round1(allPct.reduce((x, y) => x + y, 0) / allPct.length) : null,
    highPct: allPct.length ? round1(Math.max(...allPct)) : null,
    lowPct: allPct.length ? round1(Math.min(...allPct)) : null,
    submissionPct: expectedTotal ? Math.round((latest.length / expectedTotal) * 100) : 0,
    latePct: latest.length ? Math.round((late / latest.length) * 100) : 0,
    perAssignment,
    students: [...byStudent.values()].map((s) => ({ name: s.name, avgPct: round1(s.sum / s.n) })).sort((a, b) => b.avgPct - a.avgPct).slice(0, 15),
    recent: latest.slice(0, 5).map((s) => ({ id: s.id, student: s.student.user.name, title: s.assignment.title, at: s.submittedAt.toISOString(), late: s.isLate })),
    upcoming: perAssignment.filter((a) => a.deadline > now).sort((a, b) => a.deadline.getTime() - b.deadline.getTime()).slice(0, 5),
  };
}
