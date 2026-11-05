import { GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-navy-950 to-navy-800 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-white">
          <GraduationCap className="h-6 w-6" aria-hidden />
          <span className="text-lg font-semibold">Assignment Platform</span>
        </div>
        <Card className="p-7">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-ink-soft">{subtitle}</p>
          {children}
        </Card>
      </div>
    </main>
  );
}
