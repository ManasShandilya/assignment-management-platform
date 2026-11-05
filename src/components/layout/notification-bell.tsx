"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

type Item = { id: string; message: string; link: string | null; readAt: string | null; createdAt: string };

export function NotificationBell({ viewAllHref }: { viewAllHref: string }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ items: Item[]; unread: number }>({ items: [], unread: 0 });

  const load = useCallback(async () => {
    try { const r = await fetch("/api/notifications"); if (r.ok) setData(await r.json()); } catch { /* offline: keep what we have */ }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open]);

  async function markRead(body: { id: string } | { all: true }) {
    await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    load();
  }

  return (
    <div ref={ref} className="relative">
      <button aria-label={`Notifications${data.unread ? `, ${data.unread} unread` : ""}`} aria-expanded={open} onClick={() => { setOpen(!open); if (!open) load(); }}
        className="relative rounded-xl p-2 text-ink-soft hover:bg-surface-muted hover:text-ink">
        <Bell className="h-5 w-5" aria-hidden />
        {data.unread > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-red px-1 text-[10px] font-semibold text-white">{data.unread > 9 ? "9+" : data.unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-surface-line bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-surface-line px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {data.unread > 0 && <button onClick={() => markRead({ all: true })} className="text-xs text-accent hover:underline">Mark all as read</button>}
          </div>
          <ul className="max-h-80 overflow-auto">
            {data.items.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-soft">You're all caught up.</li>}
            {data.items.map((n) => (
              <li key={n.id}>
                <button onClick={() => { markRead({ id: n.id }); setOpen(false); if (n.link) router.push(n.link); }}
                  className={cn("flex w-full gap-3 px-4 py-3 text-left text-sm hover:bg-surface-muted", !n.readAt && "bg-accent-soft/50")}>
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-accent")} aria-hidden />
                  <span><span className="block">{n.message}</span><span className="text-xs text-ink-faint">{timeAgo(n.createdAt)}</span></span>
                </button>
              </li>
            ))}
          </ul>
          <Link href={viewAllHref} onClick={() => setOpen(false)} className="block border-t border-surface-line px-4 py-2.5 text-center text-sm text-accent hover:bg-surface-muted">View all</Link>
        </div>
      )}
    </div>
  );
}
