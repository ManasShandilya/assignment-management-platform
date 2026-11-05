import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiHandler, readJson } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";

const schema = z.union([z.object({ id: z.string().min(1) }), z.object({ all: z.literal(true) })]);

export const POST = apiHandler(async (req) => {
  const user = await requireUser();
  const body = schema.parse(await readJson(req));
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null, ...("id" in body ? { id: body.id } : {}) },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
});
