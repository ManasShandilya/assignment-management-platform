import Link from "next/link";
import { CalendarClock, Clock, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LocalTime } from "@/components/ui/local-time";
import { RemainingTime } from "@/components/ui/remaining-time";
import { STATUS_META, type StudentAssignment } from "@/lib/student-assignments";
import { cn } from "@/lib/utils";

const bar = { green: "bg-status-green", yellow: "bg-status-yellow", red: "bg-status-red", blue: "bg-status-blue", gray: "bg-status-gray" } as const;

export function AssignmentCard({ a }: { a: StudentAssignment }) {
  const meta = STATUS_META[a.status];
  const finished = a.status === "SUBMITTED" || a.status === "UNDER_EVALUATION" || a.status === "EVALUATED";
  return (
    <Link href={`/student/assignments/${a.id}`} className="group relative block overflow-hidden rounded-2xl border border-surface-line bg-white p-5 shadow-card transition-shadow hover:shadow-pop">
      <span className={cn("absolute inset-y-0 left-0 w-1", bar[meta.tone])} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold group-hover:text-accent">{a.title}</h3>
          <p className="text-xs text-ink-soft">{a.courseName} · {a.facultyName}</p>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-ink-soft">{a.description}</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-ink-soft">
        <div className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" aria-hidden /><dt className="sr-only">Assigned</dt><dd>Assigned <LocalTime iso={a.createdAt} withTime={false} /></dd></div>
        <div className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" aria-hidden /><dt className="sr-only">Maximum marks</dt><dd>{a.maxMarks} marks</dd></div>
        <div className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" aria-hidden /><dt className="sr-only">Deadline</dt><dd>Due <LocalTime iso={a.deadline} /></dd></div>
        {!finished && <div className="flex items-center gap-1.5 font-medium text-ink"><Clock className="h-3.5 w-3.5" aria-hidden /><dt className="sr-only">Remaining time</dt><dd><RemainingTime iso={a.deadline} /></dd></div>}
      </dl>
    </Link>
  );
}
