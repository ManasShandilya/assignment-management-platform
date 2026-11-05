"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, Info, UploadCloud, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LocalTime } from "@/components/ui/local-time";
import { useToast } from "@/components/ui/toast";
import type { SubmitPanelProps } from "@/lib/submissions";
import { cn } from "@/lib/utils";

const MAX_FILES = 5;
const size = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

// fetch() can't report upload progress, so this uses XMLHttpRequest.
function upload(url: string, body: FormData, onProgress: (pct: number) => void) {
  return new Promise<{ status: number; data: Record<string, unknown> }>((resolve) => {
    const x = new XMLHttpRequest();
    x.open("POST", url);
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    x.onload = () => {
      let data = {};
      try { data = JSON.parse(x.responseText); } catch { /* non-JSON error page */ }
      resolve({ status: x.status, data });
    };
    x.onerror = () => resolve({ status: 0, data: { error: "Can't reach the server. Check your connection." } });
    x.send(body);
  });
}

export function SubmitPanel(p: SubmitPanelProps) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ at: string; late: boolean } | null>(null);

  if (p.blockedReason && !done) {
    return <Card className="flex items-start gap-3 text-sm text-ink-soft"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{p.blockedReason}</Card>;
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const bad: string[] = [];
    const ok = incoming.filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      if (!p.formats.includes(ext)) { bad.push(`${f.name}: only ${p.formats.map((x) => x.toUpperCase()).join(", ")} files are accepted`); return false; }
      if (f.size > p.maxMb * 1048576) { bad.push(`${f.name}: larger than ${p.maxMb} MB`); return false; }
      return true;
    });
    if (!p.allowMultiple && ok.length > 1) bad.push("This assignment takes one file. Using the first one.");
    setProblems(bad);
    setDone(null);
    setError("");
    setFiles(p.allowMultiple ? [...files, ...ok].slice(0, MAX_FILES) : ok.slice(0, 1));
  }

  async function submit() {
    setError("");
    setProgress(0);
    const body = new FormData();
    files.forEach((f) => body.append("files", f));
    const res = await upload(`/api/student/assignments/${p.assignmentId}/submissions`, body, setProgress);
    setProgress(null);
    if (res.status !== 201) { setError(String(res.data.error ?? "The upload failed. Try again.")); return; }
    setDone({ at: String(res.data.submittedAt), late: Boolean(res.data.isLate) });
    setFiles([]);
    toast("success", "Assignment submitted");
    router.refresh();
  }

  const uploading = progress !== null;
  return (
    <Card className="space-y-4">
      <h2 className="text-sm font-semibold">{p.resubmit ? "Submit a new version" : "Submit your work"}</h2>

      {done && (
        <div role="status" className="flex items-start gap-3 rounded-xl bg-status-green/10 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-green" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold">Assignment Submitted Successfully!</p>
            <p className="mt-0.5 text-ink-soft">Received <LocalTime iso={done.at} /> · <Badge tone={done.late ? "yellow" : "green"}>{done.late ? "Late" : "On time"}</Badge></p>
          </div>
        </div>
      )}

      {p.willBeLate && !done && (
        <p className="flex items-start gap-2 rounded-xl bg-status-yellow/10 p-3 text-sm"><Info className="mt-0.5 h-4 w-4 shrink-0 text-status-yellow" aria-hidden />The deadline has passed. This will be recorded as a late submission.</p>
      )}

      <label htmlFor="submission-file"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!uploading) addFiles(e.dataTransfer.files); }}
        className={cn("flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors focus-within:ring-2 focus-within:ring-accent",
          dragging ? "border-accent bg-accent-soft" : "border-surface-line hover:border-accent-ring", uploading && "pointer-events-none opacity-60")}>
        <UploadCloud className="h-8 w-8 text-accent" aria-hidden />
        <span className="mt-2 text-sm font-medium">Drop {p.allowMultiple ? "files" : "your file"} here or browse</span>
        <span className="mt-1 text-xs text-ink-soft">{p.formats.map((f) => f.toUpperCase()).join(", ")} · up to {p.maxMb} MB{p.allowMultiple ? ` · up to ${MAX_FILES} files` : ""}</span>
        <input id="submission-file" ref={inputRef} type="file" className="sr-only" multiple={p.allowMultiple} disabled={uploading}
          accept={p.formats.map((f) => `.${f}`).join(",")} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      </label>

      {problems.length > 0 && <ul role="alert" className="space-y-0.5 text-xs text-status-red">{problems.map((m) => <li key={m}>{m}</li>)}</ul>}

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden /><span className="truncate">{f.name}</span><span className="shrink-0 text-xs text-ink-faint">{size(f.size)}</span></span>
              <button type="button" disabled={uploading} aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="rounded p-1 text-ink-soft hover:bg-white"><X className="h-4 w-4" aria-hidden /></button>
            </li>
          ))}
        </ul>
      )}

      {uploading && (
        <div aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-surface-line" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-ink-soft">{progress === 100 ? "Checking your file…" : `Uploading… ${progress}%`}</p>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-status-red">{error}</p>}

      <div className="flex justify-end">
        <Button onClick={submit} loading={uploading} disabled={files.length === 0}>{p.resubmit ? "Submit new version" : "Submit assignment"}</Button>
      </div>
    </Card>
  );
}
