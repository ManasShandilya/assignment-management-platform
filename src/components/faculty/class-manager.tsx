"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type Opt = { id: string; label: string };

export function ClassManager({ mine, available }: { mine: Opt[]; available: Opt[] }) {
  const router = useRouter();
  const toast = useToast();
  const [sectionId, setSectionId] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Opt | null>(null);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!sectionId) { toast("error", "Choose a class to add"); return; }
    setAdding(true);
    const res = await fetch("/api/faculty/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sectionId }) });
    setAdding(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast("error", data.error ?? "Couldn't add the class"); return; }
    setSectionId("");
    toast("success", "Class added");
    router.refresh();
  }

  async function remove() {
    if (!removing) return;
    setBusy(true);
    const res = await fetch(`/api/faculty/classes/${removing.id}`, { method: "DELETE" });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    setRemoving(null);
    if (!res.ok) { toast("error", data.error ?? "Couldn't remove the class"); return; }
    toast("success", "Class removed");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-sm font-semibold">Add a class you teach</h2>
        {available.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No other classes are available. Classes come from the course list in the database (run <code>npm run db:seed</code> for demo classes).</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select aria-label="Class" value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="h-10 flex-1 rounded-xl border border-surface-line bg-white px-3 text-sm">
              <option value="">Choose a class</option>
              {available.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <Button onClick={add} loading={adding}>Add class</Button>
          </div>
        )}
      </Card>
      <Card className="p-0">
        <h2 className="border-b border-surface-line px-5 py-3 text-sm font-semibold">Your classes</h2>
        {mine.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink-soft">You haven't added a class yet. Add one above to start creating assignments.</p>
        ) : (
          <ul className="divide-y divide-surface-line">
            {mine.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span>{c.label}</span>
                <Button variant="ghost" aria-label={`Remove ${c.label}`} onClick={() => setRemoving(c)}><Trash2 className="h-4 w-4" aria-hidden /></Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <ConfirmDialog open={!!removing} title="Remove this class?" description={removing?.label ?? ""} confirmLabel="Remove class" danger loading={busy} onConfirm={remove} onCancel={() => setRemoving(null)} />
    </div>
  );
}
