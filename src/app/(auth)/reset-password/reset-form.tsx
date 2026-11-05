"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { postJson } from "@/lib/client";
import { passwordRule } from "@/lib/validation/auth";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (token.length < 32) {
    return (
      <AuthShell title="Link not valid" subtitle="This reset link is incomplete.">
        <Link href="/forgot-password" className="text-sm text-accent hover:underline">Request a new link</Link>
      </AuthShell>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    const parsed = passwordRule.safeParse(password);
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setError(""); setLoading(true);
    const res = await postJson("/api/auth/reset", { token, password });
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    toast("success", "Password updated. Sign in with your new password.");
    router.replace("/login");
  }

  return (
    <AuthShell title="Set a new password" subtitle="Use at least 8 characters with a letter and a number.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input label="New password" name="password" type="password" autoComplete="new-password" error={error} />
        <Button type="submit" loading={loading} className="w-full">Set new password</Button>
      </form>
    </AuthShell>
  );
}
