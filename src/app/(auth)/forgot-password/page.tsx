"use client";
import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/client";
import { forgotSchema } from "@/lib/validation/auth";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = forgotSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setError(""); setLoading(true);
    const res = await postJson<{ message: string }>("/api/auth/forgot", parsed.data);
    setLoading(false);
    if (res.ok) setMessage(res.data.message); else setError(res.error);
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send a reset link.">
      {message ? <p role="status" className="text-sm">{message}</p> : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Input label="Email" name="email" type="email" autoComplete="email" error={error} />
          <Button type="submit" loading={loading} className="w-full">Send reset link</Button>
        </form>
      )}
      <p className="mt-5 text-center text-sm"><Link href="/login" className="text-accent hover:underline">Back to sign in</Link></p>
    </AuthShell>
  );
}
