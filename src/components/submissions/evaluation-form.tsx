"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Action = "save" | "publish" | "return" | "unpublish";
export interface EvaluationFormProps {
  submissionId: string; maxMarks: number; isLate: boolean; penaltyPct: number;
  initial: { marks: number | null; feedback: string; remarks: string; published: boolean };
  mode: "EDITABLE" | "RETURNED" | "SUPERSEDED";
}
const area = "w-full rounded-xl border border-surface-line bg-white px-3 py-2 text-sm";

export function EvaluationForm(p: EvaluationFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [marks, setMarks] = useState(p.initial.marks === null ? "" : String(p.initial.marks));
  const [feedback, setFeedback] = useState(p.initial.feedback);
  const [remarks, setRemarks] = useState(p.initial.remarks);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Action | "">("");
  const [confirmReturn, setConfirmReturn] = useState(false);

  if (p.mode === "SUPERSEDED") {
    return <Card className="flex items-start gap-3 text-sm text-ink-soft"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />The student uploaded a newer version. Evaluation happens on the latest version.</Card>;
  }
  if (p.mode === "RETURNED") {
    return <Card className="flex items-start gap-3 text-sm text-ink-soft"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Returned for correction. You can evaluate again once the student uploads a corrected version.</Card>;
  }

  const m = marks === "" ? null : Number(marks);
  const valid = m !== null && Number.isFinite(m) && m >= 0 && m <= p.maxMarks;
  const penalised = p.isLate && p.penaltyPct > 0 && valid ? Math.round(m * (100 - p.penaltyPct)) / 100 : null;

  async function send(action: Action) {
    const next: Record<string, string> = {};
    if ((action === "save" || action === "publish") && !valid) next.marks = `Enter marks from 0 to ${p.maxMarks}`;
    if (action === "return" && !feedback.trim()) next.feedback = "Add feedback explaining what to fix";
    setErrors(next);
    if (Object.keys(next).length) { setConfirmReturn(false); return; }

    setBusy(action);
    const res = await fetch(`/api/faculty/submissions/${p.submissionId}/evaluation`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, marks: m, feedback, remarks }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(""); setConfirmReturn(false);
    if (!res.ok) { setErrors(data.fields ?? {}); toast("error", data.error ?? "Couldn't save the evaluation"); return; }
    toast("success", { save: "Evaluation saved", publish: "Marks published", return: "Returned for correction", unpublish: "Marks withdrawn" }[action]);
    router.refresh();
  }

  return (
    <Card className="space-y-4">
      <h2 className="text-sm font-semibold">Evaluation</h2>
      <Input label={`Marks obtained (out of ${p.maxMarks})`} type="number" min={0} max={p.maxMarks} step="0.5" value={marks} onChange={(e) => setMarks(e.target.value)} error={errors.marks} />
      {p.isLate && p.penaltyPct > 0 && (
        <p className="text-sm text-ink-soft">Late submission: a {p.penaltyPct}% penalty is applied automatically.{penalised !== null && <> The student will see <strong>{penalised}</strong> / {p.maxMarks}.</>}</p>
      )}
      <div className="space-y-1.5">
        <label htmlFor="feedback" className="text-sm font-medium">Feedback <span className="font-normal text-ink-faint">(shown to the student when published)</span></label>
        <textarea id="feedback" rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} className={area} />
        {errors.feedback && <p className="text-xs text-status-red">{errors.feedback}</p>}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="remarks" className="text-sm font-medium">Private remarks <span className="font-normal text-ink-faint">(only you can see these)</span></label>
        <textarea id="remarks" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} className={area} />
      </div>
      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="ghost" className="text-status-red" disabled={busy !== ""} onClick={() => setConfirmReturn(true)}>Return for correction</Button>
        <div className="flex flex-wrap gap-2">
          {p.initial.published && <Button variant="secondary" loading={busy === "unpublish"} disabled={busy !== ""} onClick={() => send("unpublish")}>Withdraw marks</Button>}
          {!p.initial.published && <Button variant="secondary" loading={busy === "save"} disabled={busy !== ""} onClick={() => send("save")}>Save evaluation</Button>}
          <Button loading={busy === "publish"} disabled={busy !== ""} onClick={() => send("publish")}>{p.initial.published ? "Update published marks" : "Publish marks"}</Button>
        </div>
      </div>
      <ConfirmDialog open={confirmReturn} title="Return for correction?" description="The student is told to fix their work and can upload a new version. Your feedback is shown to them." confirmLabel="Return submission" danger loading={busy === "return"} onConfirm={() => send("return")} onCancel={() => setConfirmReturn(false)} />
    </Card>
  );
}
