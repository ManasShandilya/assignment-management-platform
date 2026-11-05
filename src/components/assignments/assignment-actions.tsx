"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export function AssignmentActions({ id, title, status }: { id: string; title: string; status: "DRAFT" | "PUBLISHED" }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function call(method: "PATCH" | "DELETE", body?: unknown) {
    setBusy(true);
    const res = await fetch(`/api/faculty/assignments/${id}`, {
      method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast("error", data.error ?? "Something went wrong"); return false; }
    router.refresh();
    return true;
  }

  const next = status === "DRAFT" ? "PUBLISHED" : "DRAFT";
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/faculty/assignments/${id}/edit`} aria-label={`Edit ${title}`} className="rounded-lg p-2 text-ink-soft hover:bg-surface-muted"><Pencil className="h-4 w-4" aria-hidden /></Link>
      <Button variant="ghost" className="h-9 px-2" disabled={busy} aria-label={`${status === "DRAFT" ? "Publish" : "Unpublish"} ${title}`}
        onClick={async () => { if (await call("PATCH", { status: next })) toast("success", next === "PUBLISHED" ? "Published" : "Moved to drafts"); }}>
        {status === "DRAFT" ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />}
        <span className="text-xs">{status === "DRAFT" ? "Publish" : "Unpublish"}</span>
      </Button>
      <Button variant="ghost" className="h-9 px-2 text-status-red" disabled={busy} aria-label={`Delete ${title}`} onClick={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4" aria-hidden /></Button>
      <ConfirmDialog open={confirmDelete} title="Delete this assignment?" description={`"${title}" and all its files and submissions will be permanently removed.`}
        confirmLabel="Delete assignment" danger loading={busy} onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => { if (await call("DELETE")) { setConfirmDelete(false); toast("success", "Assignment deleted"); } else setConfirmDelete(false); }} />
    </div>
  );
}
