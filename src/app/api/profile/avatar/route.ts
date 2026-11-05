import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { apiHandler, HttpError } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { streamFile } from "@/lib/files";
import { rateLimit } from "@/lib/rate-limit";
import { storage } from "@/lib/storage/provider";
import { validateFile } from "@/lib/uploads";

// Your own picture only.
export const GET = apiHandler(async (req) => {
  const session = await requireUser();
  const user = await db.user.findUnique({ where: { id: session.id }, select: { avatarPath: true } });
  if (!user?.avatarPath) throw new HttpError(404, "No profile picture");
  const mimeType = user.avatarPath.endsWith(".png") ? "image/png" : "image/jpeg";
  return streamFile(req, { storageKey: user.avatarPath, mimeType, originalName: "avatar" });
});

export const POST = apiHandler(async (req) => {
  const session = await requireUser();
  rateLimit(`avatar:${session.id}`, 10, 60 * 60 * 1000);
  let form: FormData;
  try { form = await req.formData(); } catch { throw new HttpError(400, "Invalid upload"); }
  const file = form.get("avatar");
  if (!(file instanceof File) || file.size === 0) throw new HttpError(400, "Choose an image");
  const valid = await validateFile(file, ["png", "jpg"], 2 * 1024 * 1024);

  const ext = valid.mime === "image/png" ? ".png" : ".jpg";
  const key = `avatars/${session.id}/${randomUUID()}${ext}`;
  await storage.save(key, valid.buffer);
  const old = (await db.user.findUnique({ where: { id: session.id }, select: { avatarPath: true } }))?.avatarPath;
  await db.user.update({ where: { id: session.id }, data: { avatarPath: key } });
  if (old) await storage.delete(old).catch(() => {});
  return NextResponse.json({ ok: true });
});
