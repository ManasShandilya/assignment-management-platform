import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { COOKIE_NAME, SESSION_SECONDS, homeFor, signToken, verifyToken, type Role } from "./jwt";

// The token is only a pointer. Role and validity always come from the database,
// so a changed role or a bumped sessionVersion takes effect immediately.
export const getSession = cache(async () => {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const p = await verifyToken(token);
  if (!p) return null;
  const u = await db.user.findUnique({
    where: { id: p.sub },
    select: { id: true, email: true, name: true, role: true, avatarPath: true, sessionVersion: true },
  });
  if (!u || u.sessionVersion !== p.sv || u.role !== p.role) return null;
  const { sessionVersion: _sv, ...safe } = u;
  return safe;
});

export async function createSession(user: { id: string; role: Role; sessionVersion: number }) {
  const token = await signToken({ sub: user.id, role: user.role, sv: user.sessionVersion });
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: SESSION_SECONDS,
  });
}

export const clearSession = () => cookies().delete(COOKIE_NAME);

// For server components and layouts: redirect instead of throwing.
export async function requirePageRole(role: Role) {
  const u = await getSession();
  if (!u) redirect("/login");
  if (u.role !== role) redirect(homeFor(u.role));
  return u;
}
