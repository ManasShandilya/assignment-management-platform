import { CalendarGrid, type CalEvent } from "@/components/calendar/calendar-grid";
import { db } from "@/lib/db";
import { currentFaculty } from "@/lib/faculty";
import { loadFacultyStats } from "@/lib/faculty-stats";

export default async function FacultyCalendarPage() {
  const { faculty } = await currentFaculty();
  const now = new Date();
  const [stats, assignments, subs] = await Promise.all([
    loadFacultyStats(faculty.id),
    db.assignment.findMany({ where: { facultyId: faculty.id }, select: { id: true, title: true, status: true, createdAt: true, deadline: true } }),
    db.submission.findMany({
      where: { assignment: { facultyId: faculty.id } }, orderBy: { submittedAt: "desc" }, take: 300,
      select: { id: true, submittedAt: true, assignmentId: true, student: { select: { user: { select: { name: true } } } }, assignment: { select: { title: true } } },
    }),
  ]);
  // Overdue: the deadline has passed and some students still haven't submitted.
  const overdue = new Set(stats.perAssignment.filter((a) => a.deadline < now && a.submitted < a.expected).map((a) => a.id));
  const events: CalEvent[] = [
    ...assignments.map((a): CalEvent => ({ id: `c-${a.id}`, date: a.createdAt.toISOString(), title: `Created: ${a.title}`, kind: "created", href: `/faculty/assignments/${a.id}/edit` })),
    ...assignments.filter((a) => a.status === "PUBLISHED").map((a): CalEvent => ({
      id: `d-${a.id}`, date: a.deadline.toISOString(), title: `${overdue.has(a.id) ? "Overdue" : "Deadline"}: ${a.title}`,
      kind: overdue.has(a.id) ? "overdue" : "deadline", href: `/faculty/submissions?assignment=${a.id}`,
    })),
    ...subs.map((s): CalEvent => ({ id: `s-${s.id}`, date: s.submittedAt.toISOString(), title: `${s.student.user.name} submitted ${s.assignment.title}`, kind: "submitted", href: `/faculty/submissions/${s.id}` })),
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Calendar</h1>
      <CalendarGrid events={events} />
    </div>
  );
}
