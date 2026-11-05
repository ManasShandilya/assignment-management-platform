import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler } from "@/lib/errors";
import { clearSession, getSession } from "@/lib/auth/session";

// Bumping sessionVersion invalidates the token everywhere, not just in this browser.
export const POST = apiHandler(async () => {
  const user = await getSession();
  if (user) await db.user.update({ where: { id: user.id }, data: { sessionVersion: { increment: 1 } } });
  clearSession();
  return NextResponse.json({ ok: true });
});
