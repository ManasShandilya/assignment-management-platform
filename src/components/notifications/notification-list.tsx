"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

export type NotificationItem = { id: string; message: string; link: string | null; readAt: string | null; createdAt: string };

export function NotificationList({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const unread = items.filter((i) => !i.readAt).length;
  async function read(body: { id: string } | { all: true }) {
    await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    router.refresh();
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">{unread} unread</p>
        {unread > 0 && <Button variant="secondary" onClick={() => read({ all: true })}>Mark all as read</Button>}
      </div>
      {items.length === 0 ? (
        <Card className="py-12 text-center"><p className="font-medium">No notifications yet</p><p className="mt-1 text-sm text-ink-soft">Updates about assignments and marks will appear here.</p></Card>
      ) : (
        <Card className="divide-y divide-surface-line p-0">
          {items.map((n) => (
            <div key={n.id} className={cn("flex items-start justify-between gap-3 px-5 py-4 text-sm", !n.readAt && "bg-accent-soft/50")}>
              <div>
                <p className={cn(!n.readAt && "font-medium")}>{n.message}</p>
                <p className="mt-0.5 text-xs text-ink-faint">{timeAgo(n.createdAt)}</p>
              </div>
              <div className="flex shrink-0 gap-3 text-xs">
                {n.link && <button onClick={async () => { if (!n.readAt) await read({ id: n.id }); router.push(n.link!); }} className="text-accent hover:underline">Open</button>}
                {!n.readAt && <button onClick={() => read({ id: n.id })} className="text-ink-soft hover:underline">Mark as read</button>}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
