import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";

// For student pages: the signed-in student user plus their student record.
export async function currentStudent() {
  const user = await requirePageRole("STUDENT");
  const student = await db.student.findUnique({ where: { userId: user.id } });
  if (!student) redirect("/login");
  return { user, student };
}
