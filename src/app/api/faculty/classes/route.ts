import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiHandler, HttpError, readJson } from "@/lib/errors";
import { requireFaculty } from "@/lib/auth/guards";

export const POST = apiHandler(async (req) => {
  const { faculty } = await requireFaculty();
  const { sectionId } = z.object({ sectionId: z.string().min(1) }).parse(await readJson(req));
  const section = await db.section.findUnique({ where: { id: sectionId } });
  if (!section) throw new HttpError(404, "Class not found");
  try {
    await db.facultySubject.create({ data: { facultyId: faculty.id, courseId: section.courseId, sectionId } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new HttpError(409, "You already teach this class");
    throw e;
  }
  return NextResponse.json({ ok: true }, { status: 201 });
});
