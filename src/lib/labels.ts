export const sectionLabel = (s: { name: string; semester: number; course: { name: string } }) =>
  `${s.course.name} · Semester ${s.semester} · Section ${s.name}`;
