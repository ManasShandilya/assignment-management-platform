"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/client";
import { cn } from "@/lib/utils";
import { registerSchema } from "@/lib/validation/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"STUDENT" | "FACULTY">("STUDENT");
  const [sections, setSections] = useState<{ id: string; label: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/sections").then((r) => r.json()).then((d) => setSections(d.sections ?? [])).catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const parsed = registerSchema.safeParse({ ...Object.fromEntries(new FormData(e.currentTarget)), role });
    if (!parsed.success) {
      const f: Record<string, string> = {};
      for (const i of parsed.error.issues) f[String(i.path[0])] ??= i.message;
      setErrors(f);
      return;
    }
    setErrors({});
    setLoading(true);
    const res = await postJson<{ redirect: string }>("/api/auth/register", parsed.data);
    if (!res.ok) { setErrors(res.fields); setFormError(res.error); setLoading(false); return; }
    router.replace(res.data.redirect);
    router.refresh();
  }

  return (
    <AuthShell title="Create your account" subtitle="Choose your role, then fill in your details.">
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-muted p-1" role="tablist">
        {(["STUDENT", "FACULTY"] as const).map((r) => (
          <button key={r} type="button" role="tab" aria-selected={role === r} onClick={() => { setRole(r); setErrors({}); }}
            className={cn("h-9 rounded-lg text-sm font-medium transition-colors", role === r ? "bg-white shadow-card" : "text-ink-soft")}>
            {r === "STUDENT" ? "Student" : "Faculty"}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input label="Full name" name="name" autoComplete="name" error={errors.name} />
        <Input label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
        <Input label="Password" name="password" type="password" autoComplete="new-password" error={errors.password} />
        {role === "STUDENT" ? (
          <>
            <Input label="Registration number" name="regNo" error={errors.regNo} />
            <Input label="Branch" name="branch" error={errors.branch} />
            <div className="space-y-1.5">
              <label htmlFor="sectionId" className="text-sm font-medium">Section</label>
              <select id="sectionId" name="sectionId" defaultValue="" className="h-10 w-full rounded-xl border border-surface-line bg-white px-3 text-sm">
                <option value="" disabled>Choose your section</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              {errors.sectionId && <p className="text-xs text-status-red">{errors.sectionId}</p>}
            </div>
          </>
        ) : (
          <>
            <Input label="Faculty invite code" name="inviteCode" error={errors.inviteCode} />
            <Input label="Faculty ID" name="facultyCode" error={errors.facultyCode} />
            <Input label="Department" name="department" error={errors.department} />
            <Input label="Designation" name="designation" error={errors.designation} />
          </>
        )}
        {formError && !Object.keys(errors).length && <p role="alert" className="text-sm text-status-red">{formError}</p>}
        <Button type="submit" loading={loading} className="w-full">Create account</Button>
        <p className="text-center text-sm text-ink-soft">Already registered? <Link href="/login" className="text-accent hover:underline">Sign in</Link></p>
      </form>
    </AuthShell>
  );
}
