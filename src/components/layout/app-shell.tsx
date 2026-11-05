"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Award, BarChart3, Bell, CalendarDays, ClipboardList, Contact, FileCheck2, FilePlus2, GraduationCap, History,
  LayoutDashboard, ListChecks, Menu, Upload, UserCircle, Users, X,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { cn } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboard, create: FilePlus2, manage: ListChecks, classes: Users, assignments: ClipboardList, submit: Upload,
  submissions: FileCheck2, results: Award, students: Contact, analytics: BarChart3, calendar: CalendarDays,
  notifications: Bell, profile: UserCircle, history: History,
};
export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

export function AppShell({ items, userName, roleLabel, notificationsHref, hasAvatar, children }: {
  items: NavItem[]; userName: string; roleLabel: string; notificationsHref: string; hasAvatar: boolean; children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // The longest matching href wins, so /assignments/new doesn't also light up /assignments.
  const active = items.filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5 text-white">
        <GraduationCap className="h-5 w-5" aria-hidden />
        <span className="font-semibold">Assignment Platform</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Main">
        {items.map(({ href, label, icon }) => {
          const Icon = ICONS[icon];
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active === href ? "page" : undefined}
              className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active === href ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}>
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-3 pb-2">
          {hasAvatar
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src="/api/profile/avatar?inline=1" alt="" className="h-8 w-8 rounded-full object-cover" />
            : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-medium text-white" aria-hidden>{userName.charAt(0).toUpperCase()}</span>}
          <div className="min-w-0"><p className="truncate text-sm font-medium text-white">{userName}</p><p className="text-xs text-white/60">{roleLabel}</p></div>
        </div>
        <LogoutButton className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy-900 lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-navy-950/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-navy-900">{nav}</aside>
        </div>
      )}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-surface-line bg-white/90 px-4 py-2.5 backdrop-blur">
        <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-lg p-1.5 hover:bg-surface-muted lg:hidden">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        <span className="text-sm font-semibold lg:hidden">Assignment Platform</span>
        <div className="ml-auto"><NotificationBell viewAllHref={notificationsHref} /></div>
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
    </div>
  );
}
