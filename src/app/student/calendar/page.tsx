import { CalendarGrid, type CalEvent } from "@/components/calendar/calendar-grid";
import { currentStudent } from "@/lib/student";
import { loadStudentAssignments } from "@/lib/student-assignments";

export default async function StudentCalendarPage() {
  const { student } = await currentStudent();
  const items = await loadStudentAssignments(student);
  const events: CalEvent[] = items.flatMap((a) => {
    const href = `/student/assignments/${a.id}`;
    const list: CalEvent[] = [
      { id: `c-${a.id}`, date: a.createdAt, title: `Assigned: ${a.title}`, kind: "created", href },
      { id: `d-${a.id}`, date: a.deadline, title: `${a.status === "OVERDUE" ? "Overdue" : "Due"}: ${a.title}`, kind: a.status === "OVERDUE" ? "overdue" : "deadline", href },
    ];
    if (a.submittedAt) list.push({ id: `s-${a.id}`, date: a.submittedAt, title: `You submitted: ${a.title}`, kind: "submitted", href });
    return list;
  });
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Calendar</h1>
      <CalendarGrid events={events} />
    </div>
  );
}
