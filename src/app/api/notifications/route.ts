import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { generateDeadlineReminders } from "@/lib/notifications";

// Always scoped to the signed-in user. There is no way to ask for someone else's notifications.
export const GET = apiHandler(async () => {
  const user = await requireUser();
  await generateDeadlineReminders().catch((e) => console.error("reminders failed", e));
  const [items, unread] = await Promise.all([
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, type: true, message: true, link: true, readAt: true, createdAt: true } }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return NextResponse.json({ items, unread });
});
