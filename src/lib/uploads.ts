import path from "path";
import { HttpError } from "@/lib/errors";

const OLE = [0xd0, 0xcf, 0x11, 0xe0]; // .doc / .ppt
const ZIP = [0x50, 0x4b, 0x03, 0x04]; // .docx / .pptx
export const FORMATS = {
  pdf: { exts: [".pdf"], mimes: ["application/pdf"], magic: [0x25, 0x50, 0x44, 0x46] },
  doc: { exts: [".doc"], mimes: ["application/msword"], magic: OLE },
  docx: { exts: [".docx"], mimes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], magic: ZIP },
  ppt: { exts: [".ppt"], mimes: ["application/vnd.ms-powerpoint"], magic: OLE },
  pptx: { exts: [".pptx"], mimes: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"], magic: ZIP },
  png: { exts: [".png"], mimes: ["image/png"], magic: [0x89, 0x50, 0x4e, 0x47] },
  jpg: { exts: [".jpg", ".jpeg"], mimes: ["image/jpeg"], magic: [0xff, 0xd8, 0xff] },
} as const;
export type FormatKey = keyof typeof FORMATS;

export const SUBMISSION_FORMATS = ["pdf", "doc", "docx", "ppt", "pptx"] as const;
export const ATTACHMENT_KEYS: FormatKey[] = ["pdf", "doc", "docx", "ppt", "pptx", "png", "jpg"];
export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

export interface ValidFile { buffer: Buffer; mime: string; ext: string; originalName: string; size: number }

// Checks extension, browser-reported MIME type, size and the file's real leading bytes.
export async function validateFile(file: File, allowed: readonly FormatKey[], maxBytes: number): Promise<ValidFile> {
  const name = path.basename(file.name).replace(/[\u0000-\u001f]/g, "").slice(0, 120) || "file";
  const ext = path.extname(name).toLowerCase();
  const key = allowed.find((k) => (FORMATS[k].exts as readonly string[]).includes(ext));
  if (!key) throw new HttpError(400, `${name}: this file type isn't accepted`);
  if (file.size > maxBytes) throw new HttpError(400, `${name}: file is larger than ${Math.round(maxBytes / 1048576)} MB`);
  const fmt = FORMATS[key];
  if (!(fmt.mimes as readonly string[]).includes(file.type)) throw new HttpError(400, `${name}: file type doesn't match its extension`);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!fmt.magic.every((b, i) => buffer[i] === b)) throw new HttpError(400, `${name}: file contents don't match its type`);
  return { buffer, mime: fmt.mimes[0], ext, originalName: name, size: buffer.length };
}
