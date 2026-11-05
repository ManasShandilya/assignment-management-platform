import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LocalTime } from "@/components/ui/local-time";
import { AssignmentActions } from "@/components/assignments/assignment-actions";
import { db } from "@/lib/db";
import { currentFaculty } from "@/lib/faculty";
import { sectionLabel } from "@/lib/labels";

export default async function ManageAssignmentsPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const { faculty } = await currentFaculty();
  const q = searchParams.q?.trim() ?? "";
  const status = searchParams.status === "DRAFT" || searchParams.status === "PUBLISHED" ? searchParams.status : undefined;
  const assignments = await db.assignment.findMany({
    where: { facultyId: faculty.id, status, title: q ? { contains: q, mode: "insensitive" } : undefined },
    include: { section: { include: { course: true } }, _count: { select: { submissions: true } } },
    orderBy: { createdAt: "desc" },
  });
  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Manage assignments</h1>
        <Link href="/faculty/assignments/new"><Button>Create assignment</Button></Link>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row" method="get">
        <input name="q" defaultValue={q} placeholder="Search by title" aria-label="Search by title" className="h-10 flex-1 rounded-xl border border-surface-line bg-white px-3 text-sm" />
        <select name="status" defaultValue={status ?? ""} aria-label="Status" className="h-10 rounded-xl border border-surface-line bg-white px-3 text-sm">
          <option value="">All statuses</option><option value="DRAFT">Drafts</option><option value="PUBLISHED">Published</option>
        </select>
        <Button type="submit" variant="secondary">Apply filters</Button>
      </form>

      {assignments.length === 0 ? (
        <Card className="py-10 text-center">
          <p className="font-medium">{q || status ? "No assignments match these filters" : "No assignments yet"}</p>
          <p className="mt-1 text-sm text-ink-soft">{q || status ? "Try a different search or clear the filters." : "Create your first assignment to send work to a class."}</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-surface-line text-xs text-ink-soft">
              <tr><th className="px-5 py-3 font-medium">Assignment</th><th className="px-3 py-3 font-medium">Deadline</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Submissions</th><th className="px-5 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-surface-line">
              {assignments.map((a) => {
                const closed = a.status === "PUBLISHED" && a.deadline < now;
                return (
                  <tr key={a.id}>
                    <td className="px-5 py-3"><p className="font-medium">{a.title}</p><p className="text-xs text-ink-soft">{sectionLabel(a.section)}</p></td>
                    <td className="px-3 py-3"><LocalTime iso={a.deadline.toISOString()} /></td>
                    <td className="px-3 py-3"><Badge tone={a.status === "DRAFT" ? "gray" : closed ? "red" : "green"}>{a.status === "DRAFT" ? "Draft" : closed ? "Deadline passed" : "Published"}</Badge></td>
                    <td className="px-3 py-3">{a._count.submissions}</td>
                    <td className="px-5 py-3"><AssignmentActions id={a.id} title={a.title} status={a.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
