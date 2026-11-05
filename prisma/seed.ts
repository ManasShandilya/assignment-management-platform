// DEMO DATA. Creates one course with two sections so the register form has something to show.
// `npm run db:seed` adds it, `npm run db:unseed` removes it (only works while no student is enrolled in it).
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  if (process.argv.includes("--remove")) {
    await db.section.deleteMany({ where: { course: { code: { startsWith: "DEMO-" } } } });
    await db.course.deleteMany({ where: { code: { startsWith: "DEMO-" } } });
    console.log("Demo course and sections removed.");
    return;
  }
  const course = await db.course.upsert({
    where: { code: "DEMO-CSE" }, update: {}, create: { code: "DEMO-CSE", name: "B.Tech Computer Science (demo)" },
  });
  for (const name of ["A", "B"]) {
    await db.section.upsert({
      where: { courseId_name_semester: { courseId: course.id, name, semester: 3 } },
      update: {}, create: { courseId: course.id, name, semester: 3 },
    });
  }
  console.log("Demo course with sections A and B (semester 3) added.");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
