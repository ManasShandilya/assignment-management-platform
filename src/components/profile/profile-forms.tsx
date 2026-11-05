"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { passwordRule } from "@/lib/validation/auth";

async function send(url: string, method: string, body: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, error: String(data.error ?? "Something went wrong. Try again."), fields: (data.fields ?? {}) as Record<string, string> };
}

export function AvatarUploader({ name, hasAvatar, version }: { name: string; hasAvatar: boolean; version: number }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  async function upload(file: File) {
    setBusy(true);
    const body = new FormData();
    body.set("avatar", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { toast("error", data.error ?? "Couldn't upload the picture"); return; }
    toast("success", "Profile picture updated");
    router.refresh();
  }
  return (
    <div className="flex items-center gap-4">
      {hasAvatar
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={`/api/profile/avatar?inline=1&v=${version}`} alt="Your profile picture" className="h-20 w-20 rounded-full object-cover" />
        : <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft text-2xl font-semibold text-accent" aria-hidden>{name.charAt(0).toUpperCase()}</span>}
      <div>
        <Button variant="secondary" loading={busy} onClick={() => input.current?.click()}><Camera className="h-4 w-4" aria-hidden /> {hasAvatar ? "Change photo" : "Upload photo"}</Button>
        <p className="mt-1 text-xs text-ink-faint">PNG or JPG, up to 2 MB.</p>
        <input ref={input} type="file" accept=".png,.jpg,.jpeg" className="sr-only" aria-label="Profile picture file"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      </div>
    </div>
  );
}

type Field = { name: string; label: string; value: string };
export function ProfileForm({ fields }: { fields: Field[] }) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState(Object.fromEntries(fields.map((f) => [f.name, f.value])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await send("/api/profile", "PUT", values);
    setBusy(false);
    if (!res.ok) { setErrors(res.fields); toast("error", res.error); return; }
    setErrors({}); toast("success", "Profile updated"); router.refresh();
  }
  return (
    <form onSubmit={save} noValidate className="space-y-4">
      {fields.map((f) => <Input key={f.name} label={f.label} value={values[f.name]} error={errors[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />)}
      <div className="flex justify-end"><Button type="submit" loading={busy}>Save changes</Button></div>
    </form>
  );
}

export function PasswordForm() {
  const toast = useToast();
  const [v, setV] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const rule = passwordRule.safeParse(v.newPassword);
    if (!v.currentPassword) next.currentPassword = "Enter your current password";
    if (!rule.success) next.newPassword = rule.error.issues[0].message;
    if (v.newPassword !== v.confirm) next.confirm = "The passwords don't match";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const res = await send("/api/profile/password", "POST", { currentPassword: v.currentPassword, newPassword: v.newPassword });
    setBusy(false);
    if (!res.ok) { setErrors(res.fields); toast("error", res.error); return; }
    setV({ currentPassword: "", newPassword: "", confirm: "" });
    toast("success", "Password changed. Other devices were signed out.");
  }
  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold">Change password</h2>
      <form onSubmit={save} noValidate className="space-y-4">
        <Input label="Current password" type="password" autoComplete="current-password" value={v.currentPassword} error={errors.currentPassword} onChange={(e) => setV({ ...v, currentPassword: e.target.value })} />
        <Input label="New password" type="password" autoComplete="new-password" value={v.newPassword} error={errors.newPassword} onChange={(e) => setV({ ...v, newPassword: e.target.value })} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={v.confirm} error={errors.confirm} onChange={(e) => setV({ ...v, confirm: e.target.value })} />
        <div className="flex justify-end"><Button type="submit" loading={busy}>Change password</Button></div>
      </form>
    </Card>
  );
}
