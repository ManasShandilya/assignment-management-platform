import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiHandler, HttpError, readJson } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { rateLimit } from "@/lib/rate-limit";
import { createSession } from "@/lib/auth/session";
import { passwordRule } from "@/lib/validation/auth";

const schema = z.object({ currentPassword: z.string().min(1, "Enter your current password"), newPassword: passwordRule });

export const POST = apiHandler(async (req) => {
  const session = await requireUser();
  rateLimit(`pw:${session.id}`, 5, 15 * 60 * 1000);
  const { currentPassword, newPassword } = schema.parse(await readJson(req));

  const user = await db.user.findUniqueOrThrow({ where: { id: session.id } });
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new HttpError(400, "Your current password is incorrect", { currentPassword: "Incorrect password" });
  }
  // Bumping sessionVersion signs out every other device; this one gets a fresh cookie.
  const updated = await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword), sessionVersion: { increment: 1 } } });
  await createSession(updated);
  return NextResponse.json({ ok: true });
});
