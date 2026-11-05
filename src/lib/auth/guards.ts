import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { getSession } from "./session";
import type { Role } from "./jwt";

// Call at the top of every protected route handler.
export async function requireUser() {
  const u = await getSession();
  if (!u) throw new HttpError(401, "Sign in to continue");
  return u;
}

export async function requireRole(role: Role) {
  const u = await requireUser();
  if (u.role !== role) throw new HttpError(403, "You don't have access to this");
  return u;
}

// For faculty API routes: role check plus the faculty record every ownership check hangs off.
export async function requireFaculty() {
  const user = await requireRole("FACULTY");
  const faculty = await db.faculty.findUnique({ where: { userId: user.id } });
  if (!faculty) throw new HttpError(403, "You don't have access to this");
  return { user, faculty };
}

// For student API routes: role check plus the student record every ownership check hangs off.
export async function requireStudent() {
  const user = await requireRole("STUDENT");
  const student = await db.student.findUnique({ where: { userId: user.id } });
  if (!student) throw new HttpError(403, "You don't have access to this");
  return { user, student };
}
