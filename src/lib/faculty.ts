import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";

// For faculty pages: the signed-in faculty user plus their faculty record.
export async function currentFaculty() {
  const user = await requirePageRole("FACULTY");
  const faculty = await db.faculty.findUnique({ where: { userId: user.id } });
  if (!faculty) redirect("/login");
  return { user, faculty };
}
