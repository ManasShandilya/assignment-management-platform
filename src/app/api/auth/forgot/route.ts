import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler, readJson } from "@/lib/errors";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { newToken, sha256 } from "@/lib/auth/password";
import { sendResetEmail } from "@/lib/mail";
import { forgotSchema } from "@/lib/validation/auth";

export const POST = apiHandler(async (req) => {
  rateLimit(`forgot:${clientIp(req)}`, 5, 60 * 60 * 1000);
  const { email } = forgotSchema.parse(await readJson(req));

  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    const token = newToken();
    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
    });
    const origin = req.headers.get("origin") ?? `http://${req.headers.get("host")}`;
    await sendResetEmail(user.email, `${origin}/reset-password?token=${token}`);
  }
  // Same answer whether or not the email exists.
  return NextResponse.json({ message: "If that email has an account, a reset link is on its way." });
});
