// Run with the dev server up: `npm run test:security` (BASE_URL defaults to http://localhost:3000).
// Needs at least one section (npm run db:seed). Creates a throwaway student account.
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
let failed = 0;
const check = (name: string, pass: boolean, detail = "") => {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${pass ? "" : `  (${detail})`}`);
  if (!pass) failed++;
};
const req = (path: string, init: RequestInit & { cookie?: string } = {}) =>
  fetch(BASE + path, {
    redirect: "manual", ...init,
    headers: { "Content-Type": "application/json", ...(init.cookie ? { Cookie: init.cookie } : {}) },
  });
const post = (path: string, body: unknown, cookie?: string) => req(path, { method: "POST", body: JSON.stringify(body), cookie });
const cookieOf = (r: Response) => r.headers.getSetCookie().map((c) => c.split(";")[0]).find((c) => c.startsWith("session="));
const isRedirect = (r: Response) => [307, 308].includes(r.status);

async function main() {
  const { sections } = await (await req("/api/auth/sections")).json();
  if (!sections?.length) throw new Error("No sections found. Run npm run db:seed first.");
  const id = Date.now();
  const student = { role: "STUDENT", name: "Test Student", email: `t${id}@example.com`, password: "Passw0rdTest", regNo: `R${id}`.slice(0, 20), branch: "CSE", sectionId: sections[0].id };

  const r = await post("/api/auth/register", student);
  const cookie = cookieOf(r);
  check("student can register", r.status === 201 && !!cookie, `status ${r.status}`);
  const c = cookie ?? "";

  check("student blocked from /faculty/dashboard", isRedirect(await req("/faculty/dashboard", { cookie: c })));
  check("student gets 403 on faculty API", (await req("/api/faculty/ping", { cookie: c })).status === 403);
  check("student can use student API", (await req("/api/student/ping", { cookie: c })).status === 200);
  check("anonymous gets 401 on faculty API", (await req("/api/faculty/ping")).status === 401);
  check("anonymous redirected from /student/dashboard", isRedirect(await req("/student/dashboard")));
  check("forged token rejected", (await req("/api/student/ping", { cookie: "session=abc.def.ghi" })).status === 401);

  const fac = { role: "FACULTY", name: "X Faculty", email: `f${id}@example.com`, password: "Passw0rdTest", inviteCode: "wrong-code", facultyCode: `F${id}`.slice(0, 20), department: "CSE", designation: "Lecturer" };
  check("faculty signup with wrong invite code rejected", (await post("/api/auth/register", fac)).status === 403);
  check("student cannot self-assign faculty role", (await post("/api/auth/register", { ...student, email: `u${id}@example.com`, regNo: `Q${id}`.slice(0, 20), role: "FACULTY" })).status === 400);

  check("log out succeeds", (await post("/api/auth/logout", {}, c)).status === 200);
  check("old cookie dead after logout", (await req("/api/student/ping", { cookie: c })).status === 401);
  check("login with wrong password rejected", (await post("/api/auth/login", { email: student.email, password: "nope12345" })).status === 401);

  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
