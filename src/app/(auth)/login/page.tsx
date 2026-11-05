"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/client";
import { loginSchema } from "@/lib/validation/auth";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setLoading(true);
    const res = await postJson<{ redirect: string }>("/api/auth/login", parsed.data);
    if (!res.ok) { setFormError(res.error); setLoading(false); return; }
    // `next` is only honoured for same-site paths.
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
    router.replace(safeNext ?? res.data.redirect);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Input label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
      <Input label="Password" name="password" type="password" autoComplete="current-password" error={errors.password} />
      {formError && <p role="alert" className="text-sm text-status-red">{formError}</p>}
      <Button type="submit" loading={loading} className="w-full">Sign in</Button>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-accent hover:underline">Forgot password?</Link>
        <Link href="/register" className="text-accent hover:underline">Create account</Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell title="Sign in" subtitle="Use your college email to open your dashboard.">
      <Suspense><LoginForm /></Suspense>
    </AuthShell>
  );
}
