import { cn } from "@/lib/utils";

// Matches the student status colours: green submitted, yellow due soon, red overdue,
// blue under evaluation, gray not started.
export type Tone = "green" | "yellow" | "red" | "blue" | "gray";
const tones: Record<Tone, string> = {
  green: "bg-status-green/10 text-status-green",
  yellow: "bg-status-yellow/10 text-status-yellow",
  red: "bg-status-red/10 text-status-red",
  blue: "bg-status-blue/10 text-status-blue",
  gray: "bg-status-gray/10 text-status-gray",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}
