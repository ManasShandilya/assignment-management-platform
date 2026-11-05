import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiHandler, HttpError, readJson } from "@/lib/errors";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { hashPassword, safeEqual } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/jwt";
import { registerSchema } from "@/lib/validation/auth";

export const POST = apiHandler(async (req) => {
  rateLimit(`register:${clientIp(req)}`, 10, 60 * 60 * 1000);
  const input = registerSchema.parse(await readJson(req));

  const passwordHash = await hashPassword(input.password);
  const base = { email: input.email, name: input.name, passwordHash, role: input.role };

  try {
    let user;
    if (input.role === "FACULTY") {
      const code = process.env.FACULTY_INVITE_CODE;
      if (!code || !safeEqual(input.inviteCode, code)) throw new HttpError(403, "That invite code isn't valid", { inviteCode: "Invalid invite code" });
      user = await db.user.create({
        data: { ...base, faculty: { create: { facultyCode: input.facultyCode, department: input.department, designation: input.designation } } },
      });
    } else {
      const section = await db.section.findUnique({ where: { id: input.sectionId }, include: { course: true } });
      if (!section) throw new HttpError(400, "Choose a valid section", { sectionId: "Choose a valid section" });
      user = await db.user.create({
        data: {
          ...base,
          student: { create: { regNo: input.regNo, branch: input.branch, program: section.course.name, semester: section.semester, sectionId: section.id } },
        },
      });
    }
    await createSession(user);
    return NextResponse.json({ redirect: homeFor(user.role) }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "An account with that email or ID already exists");
    }
    throw e;
  }
});
