"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { assignmentSchema } from "@/lib/validation/assignment";

export type FormSubject = { id: string; label: string; sectionId: string };
export type FormStudent = { id: string; name: string; regNo: string; sectionId: string };
export type FormInitial = {
  id: string; subjectId: string; title: string; description: string; instructions: string; deadline: string;
  maxMarks: number; allowedFormats: string[]; maxFileSizeMb: number; allowMultiple: boolean; allowResubmission: boolean;
  allowLate: boolean; latePenaltyPct: number; visibility: "CLASS" | "INDIVIDUAL"; studentIds: string[];
  status: "DRAFT" | "PUBLISHED"; attachments: { id: string; originalName: string; isReference: boolean }[];
};

const FORMATS = ["pdf", "doc", "docx", "ppt", "pptx"];
const field = "w-full rounded-xl border border-surface-line bg-white px-3 text-sm";
const toLocalInput = (iso: string) => {
  const d = new Date(iso); const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card className="space-y-4"><h2 className="text-sm font-semibold">{title}</h2>{children}</Card>;
}
function Check({ name, label, checked, onChange }: { name?: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-surface-line accent-accent" />
      {label}
    </label>
  );
}
const Err = ({ msg }: { msg?: string }) => (msg ? <p className="text-xs text-status-red">{msg}</p> : null);

export function AssignmentForm({ subjects, students, initial }: { subjects: FormSubject[]; students: FormStudent[]; initial?: FormInitial }) {
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? subjects[0]?.id ?? "");
  const [formats, setFormats] = useState<string[]>(initial?.allowedFormats ?? ["pdf"]);
  const [allowMultiple, setAllowMultiple] = useState(initial?.allowMultiple ?? false);
  const [allowResubmission, setAllowResubmission] = useState(initial?.allowResubmission ?? false);
  const [allowLate, setAllowLate] = useState(initial?.allowLate ?? false);
  const [visibility, setVisibility] = useState<"CLASS" | "INDIVIDUAL">(initial?.visibility ?? "CLASS");
  const [studentIds, setStudentIds] = useState<string[]>(initial?.studentIds ?? []);
  const [removeIds, setRemoveIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<"" | "DRAFT" | "PUBLISHED">("");

  const sectionId = subjects.find((s) => s.id === subjectId)?.sectionId;
  const classStudents = useMemo(() => students.filter((s) => s.sectionId === sectionId), [students, sectionId]);
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function save(status: "DRAFT" | "PUBLISHED") {
    const fd = new FormData(formRef.current!);
    const deadlineRaw = String(fd.get("deadline") ?? "");
    const parsed = assignmentSchema.safeParse({
      subjectId, title: fd.get("title"), description: fd.get("description"), instructions: fd.get("instructions") ?? "",
      deadline: deadlineRaw ? new Date(deadlineRaw).toISOString() : "", maxMarks: Number(fd.get("maxMarks")),
      allowedFormats: formats, maxFileSizeMb: Number(fd.get("maxFileSizeMb")), allowMultiple, allowResubmission, allowLate,
      latePenaltyPct: allowLate ? Number(fd.get("latePenaltyPct") || 0) : 0, visibility,
      studentIds: visibility === "INDIVIDUAL" ? studentIds.filter((id) => classStudents.some((s) => s.id === id)) : [],
      status: initial?.status ?? status, removeAttachmentIds: removeIds,
    });
    if (!parsed.success) {
      const f: Record<string, string> = {};
      for (const i of parsed.error.issues) f[String(i.path[0])] ??= i.message;
      setErrors(f);
      toast("error", "Check the highlighted fields");
      return;
    }
    setErrors({});
    const body = new FormData();
    body.set("data", JSON.stringify(parsed.data));
    for (const name of ["questionPapers", "references"]) for (const f of fd.getAll(name)) if (f instanceof File && f.size > 0) body.append(name, f);

    setSaving(status);
    const res = await fetch(initial ? `/api/faculty/assignments/${initial.id}` : "/api/faculty/assignments", { method: initial ? "PUT" : "POST", body });
    const data = await res.json().catch(() => ({}));
    setSaving("");
    if (!res.ok) { setErrors(data.fields ?? {}); toast("error", data.error ?? "Couldn't save the assignment"); return; }
    toast("success", initial ? "Changes saved" : status === "PUBLISHED" ? "Assignment published" : "Draft saved");
    router.push("/faculty/assignments");
    router.refresh();
  }

  const existing = initial?.attachments.filter((a) => !removeIds.includes(a.id)) ?? [];

  return (
    <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="space-y-5" noValidate>
      <Section title="Details">
        <div className="space-y-1.5">
          <label htmlFor="subjectId" className="text-sm font-medium">Class</label>
          <select id="subjectId" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={`${field} h-10`}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <Err msg={errors.subjectId} />
        </div>
        <Input label="Title" name="title" defaultValue={initial?.title} error={errors.title} />
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium">Description</label>
          <textarea id="description" name="description" rows={3} defaultValue={initial?.description} className={`${field} py-2`} />
          <Err msg={errors.description} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="instructions" className="text-sm font-medium">Instructions</label>
          <textarea id="instructions" name="instructions" rows={4} defaultValue={initial?.instructions} className={`${field} py-2`} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Deadline" name="deadline" type="datetime-local" defaultValue={initial ? toLocalInput(initial.deadline) : ""} error={errors.deadline} />
          <Input label="Maximum marks" name="maxMarks" type="number" min={1} max={1000} defaultValue={initial?.maxMarks ?? 100} error={errors.maxMarks} />
        </div>
      </Section>

      <Section title="Submission rules">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Accepted formats</legend>
          <div className="flex flex-wrap gap-4">
            {FORMATS.map((f) => <Check key={f} label={f.toUpperCase()} checked={formats.includes(f)} onChange={() => setFormats(toggle(formats, f))} />)}
          </div>
          <Err msg={errors.allowedFormats} />
        </fieldset>
        <Input label="Maximum file size (MB)" name="maxFileSizeMb" type="number" min={1} max={25} defaultValue={initial?.maxFileSizeMb ?? 10} error={errors.maxFileSizeMb} />
        <div className="space-y-2">
          <Check label="Allow multiple files per submission" checked={allowMultiple} onChange={setAllowMultiple} />
          <Check label="Allow resubmission" checked={allowResubmission} onChange={setAllowResubmission} />
          <Check label="Allow late submissions" checked={allowLate} onChange={setAllowLate} />
        </div>
        {allowLate && <Input label="Late penalty (% of marks)" name="latePenaltyPct" type="number" min={0} max={100} defaultValue={initial?.latePenaltyPct ?? 0} error={errors.latePenaltyPct} />}
      </Section>

      <Section title="Who gets it">
        <div className="flex flex-wrap gap-6 text-sm">
          {([["CLASS", "Whole class"], ["INDIVIDUAL", "Selected students"]] as const).map(([v, l]) => (
            <label key={v} className="flex items-center gap-2">
              <input type="radio" name="visibility" checked={visibility === v} onChange={() => setVisibility(v)} className="accent-accent" /> {l}
            </label>
          ))}
        </div>
        {visibility === "INDIVIDUAL" && (
          <div className="max-h-56 space-y-2 overflow-auto rounded-xl border border-surface-line p-3">
            {classStudents.length === 0 ? <p className="text-sm text-ink-soft">No students are enrolled in this class yet.</p> :
              classStudents.map((s) => <Check key={s.id} label={`${s.name} (${s.regNo})`} checked={studentIds.includes(s.id)} onChange={() => setStudentIds(toggle(studentIds, s.id))} />)}
          </div>
        )}
        <Err msg={errors.studentIds} />
      </Section>

      <Section title="Question paper and reference materials">
        {existing.length > 0 && (
          <ul className="space-y-1.5 text-sm">
            {existing.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3 py-2">
                <span className="flex items-center gap-2 truncate"><Paperclip className="h-4 w-4 shrink-0" aria-hidden />{a.originalName}<span className="text-xs text-ink-faint">{a.isReference ? "Reference" : "Question paper"}</span></span>
                <button type="button" onClick={() => setRemoveIds([...removeIds, a.id])} className="text-xs text-status-red hover:underline">Remove</button>
              </li>
            ))}
          </ul>
        )}
        {[["questionPapers", "Question paper"], ["references", "Reference materials"]].map(([n, l]) => (
          <div key={n} className="space-y-1.5">
            <label htmlFor={n} className="text-sm font-medium">{l}</label>
            <input id={n} name={n} type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent" />
          </div>
        ))}
        <p className="text-xs text-ink-faint">PDF, Word, PowerPoint, PNG or JPG. Up to 15 MB each, 8 files in total.</p>
      </Section>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.push("/faculty/assignments")}>Cancel</Button>
        {initial ? (
          <Button type="button" loading={saving !== ""} onClick={() => save(initial.status)}>Save changes</Button>
        ) : (
          <>
            <Button type="button" variant="secondary" loading={saving === "DRAFT"} disabled={saving !== ""} onClick={() => save("DRAFT")}>Save as draft</Button>
            <Button type="button" loading={saving === "PUBLISHED"} disabled={saving !== ""} onClick={() => save("PUBLISHED")}>Publish</Button>
          </>
        )}
      </div>
    </form>
  );
}
