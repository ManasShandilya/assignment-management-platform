import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public on purpose: the register form needs it. Exposes only ids and labels.
export async function GET() {
  const sections = await db.section.findMany({
    select: { id: true, name: true, semester: true, course: { select: { name: true } } },
    orderBy: [{ course: { name: "asc" } }, { semester: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({
    sections: sections.map((s) => ({ id: s.id, label: `${s.course.name} · Semester ${s.semester} · Section ${s.name}` })),
  });
}
