import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler, HttpError, readJson } from "@/lib/errors";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { hashPassword, sha256 } from "@/lib/auth/password";
import { resetSchema } from "@/lib/validation/auth";

export const POST = apiHandler(async (req) => {
  rateLimit(`reset:${clientIp(req)}`, 10, 60 * 60 * 1000);
  const { token, password } = resetSchema.parse(await readJson(req));

  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new HttpError(400, "This reset link has expired. Request a new one.");
  }
  const passwordHash = await hashPassword(password);
  await db.$transaction([
    // sessionVersion bump signs the user out on every device.
    db.user.update({ where: { id: record.userId }, data: { passwordHash, sessionVersion: { increment: 1 } } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true });
});
