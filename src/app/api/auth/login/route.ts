import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler, HttpError, readJson } from "@/lib/errors";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { DUMMY_HASH, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/jwt";
import { loginSchema } from "@/lib/validation/auth";

export const POST = apiHandler(async (req) => {
  const { email, password } = loginSchema.parse(await readJson(req));
  rateLimit(`login:${clientIp(req)}:${email}`, 8, 15 * 60 * 1000);

  const user = await db.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, "Incorrect email or password");

  await createSession(user);
  return NextResponse.json({ redirect: homeFor(user.role) });
});
