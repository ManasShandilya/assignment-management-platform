import { NotificationList } from "@/components/notifications/notification-list";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";

export default async function NotificationsPage() {
  const user = await requirePageRole("STUDENT");
  const rows = await db.notification.findMany({
    where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50,
    select: { id: true, message: true, link: true, readAt: true, createdAt: true },
  });
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <NotificationList items={rows.map((r) => ({ ...r, readAt: r.readAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString() }))} />
    </div>
  );
}
