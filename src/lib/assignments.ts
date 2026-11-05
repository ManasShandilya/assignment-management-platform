import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { storage } from "@/lib/storage/provider";
import { ATTACHMENT_KEYS, MAX_ATTACHMENT_BYTES, validateFile, type ValidFile } from "@/lib/uploads";
import { assignmentSchema, type AssignmentInput } from "@/lib/validation/assignment";

const isFile = (v: FormDataEntryValue): v is File => typeof v !== "string" && v.size > 0;

// Body is multipart: `data` (JSON) plus `questionPapers` and `references` files.
// Every file is validated before anything touches the database.
export async function parseAssignmentRequest(req: NextRequest) {
  let form: FormData;
  try { form = await req.formData(); } catch { throw new HttpError(400, "Invalid form data"); }
  let raw: unknown;
  try { raw = JSON.parse(String(form.get("data"))); } catch { throw new HttpError(400, "Invalid assignment data"); }
  const data = assignmentSchema.parse(raw);

  const picked = [
    ...form.getAll("questionPapers").filter(isFile).map((file) => ({ file, isReference: false })),
    ...form.getAll("references").filter(isFile).map((file) => ({ file, isReference: true })),
  ];
  if (picked.length > 8) throw new HttpError(400, "Attach at most 8 files");
  const files = await Promise.all(
    picked.map(async (p) => ({ ...(await validateFile(p.file, ATTACHMENT_KEYS, MAX_ATTACHMENT_BYTES)), isReference: p.isReference })),
  );
  return { data, files };
}

export function assignmentFields(d: AssignmentInput) {
  return {
    title: d.title, description: d.description, instructions: d.instructions,
    deadline: new Date(d.deadline), maxMarks: d.maxMarks, allowedFormats: d.allowedFormats,
    maxFileSizeMb: d.maxFileSizeMb, allowMultiple: d.allowMultiple, allowResubmission: d.allowResubmission,
    allowLate: d.allowLate, latePenaltyPct: d.allowLate ? d.latePenaltyPct : 0,
    visibility: d.visibility, status: d.status,
  };
}

// Individual assignments may only target students who belong to the chosen section.
export async function validateTargets(d: AssignmentInput, sectionId: string) {
  if (d.visibility !== "INDIVIDUAL") return [];
  const ids = [...new Set(d.studentIds)];
  const found = await db.student.count({ where: { id: { in: ids }, sectionId } });
  if (found !== ids.length) throw new HttpError(400, "Some selected students aren't in this class", { studentIds: "Choose students from this class" });
  return ids;
}

export async function storeAttachments(assignmentId: string, files: (ValidFile & { isReference: boolean })[]) {
  const saved: string[] = [];
  try {
    for (const f of files) {
      const key = `attachments/${assignmentId}/${randomUUID()}${f.ext}`;
      await storage.save(key, f.buffer);
      saved.push(key);
      await db.assignmentAttachment.create({
        data: { assignmentId, storageKey: key, originalName: f.originalName, mimeType: f.mime, sizeBytes: f.size, isReference: f.isReference },
      });
    }
  } catch (e) {
    await Promise.all(saved.map((k) => storage.delete(k).catch(() => {})));
    throw e;
  }
}
