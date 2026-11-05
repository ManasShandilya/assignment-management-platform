import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { requirePageRole } from "@/lib/auth/session";

const ITEMS: NavItem[] = [
  { href: "/faculty/dashboard", label: "Overview", icon: "dashboard" },
  { href: "/faculty/assignments/new", label: "Create assignment", icon: "create" },
  { href: "/faculty/assignments", label: "Manage assignments", icon: "manage" },
  { href: "/faculty/submissions", label: "Submissions", icon: "submissions" },
  { href: "/faculty/students", label: "Students", icon: "students" },
  { href: "/faculty/analytics", label: "Analytics", icon: "analytics" },
  { href: "/faculty/calendar", label: "Calendar", icon: "calendar" },
  { href: "/faculty/classes", label: "My classes", icon: "classes" },
  { href: "/faculty/notifications", label: "Notifications", icon: "notifications" },
  { href: "/faculty/profile", label: "Profile", icon: "profile" },
];

// Server-side role check. A user with the wrong role never reaches the page below.
export default async function FacultyLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole("FACULTY");
  return <AppShell items={ITEMS} userName={user.name} roleLabel="Faculty" notificationsHref="/faculty/notifications" hasAvatar={!!user.avatarPath}>{children}</AppShell>;
}
