import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiHandler, HttpError, readJson } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";

const text = (n: string) => z.string().trim().min(2, `Enter ${n}`).max(60);
const base = { name: z.string().trim().min(2, "Enter your full name").max(80), email: z.string().trim().toLowerCase().email("Enter a valid email address") };
const studentSchema = z.object({ ...base, branch: text("your branch") });
const facultySchema = z.object({ ...base, department: text("your department"), designation: text("your designation") });

// The role comes from the session, never from the body, so one role can't write the other's fields.
// Registration number, faculty ID, course, semester and section are deliberately not editable here.
export const PUT = apiHandler(async (req) => {
  const user = await requireUser();
  const body = await readJson(req);
  try {
    if (user.role === "STUDENT") {
      const d = studentSchema.parse(body);
      await db.user.update({ where: { id: user.id }, data: { name: d.name, email: d.email, student: { update: { branch: d.branch } } } });
    } else {
      const d = facultySchema.parse(body);
      await db.user.update({ where: { id: user.id }, data: { name: d.name, email: d.email, faculty: { update: { department: d.department, designation: d.designation } } } });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new HttpError(409, "That email is already in use", { email: "That email is already in use" });
    throw e;
  }
  return NextResponse.json({ ok: true });
});
