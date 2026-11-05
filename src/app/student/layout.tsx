import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { requirePageRole } from "@/lib/auth/session";

const ITEMS: NavItem[] = [
  { href: "/student/dashboard", label: "Overview", icon: "dashboard" },
  { href: "/student/assignments", label: "My assignments", icon: "assignments" },
  { href: "/student/submit", label: "Submit assignment", icon: "submit" },
  { href: "/student/results", label: "My results", icon: "results" },
  { href: "/student/history", label: "Submission history", icon: "history" },
  { href: "/student/calendar", label: "Calendar", icon: "calendar" },
  { href: "/student/notifications", label: "Notifications", icon: "notifications" },
  { href: "/student/profile", label: "Profile", icon: "profile" },
];

// Server-side role check. A user with the wrong role never reaches the page below.
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole("STUDENT");
  return <AppShell items={ITEMS} userName={user.name} roleLabel="Student" notificationsHref="/student/notifications" hasAvatar={!!user.avatarPath}>{children}</AppShell>;
}
