import { NextRequest, NextResponse } from "next/server";
import { HttpError } from "@/lib/errors";
import { storage } from "@/lib/storage/provider";

// Streams a stored file. Callers must have done their own permission check first.
// Only PDFs and images may open inline; everything else downloads.
export async function streamFile(req: NextRequest, f: { storageKey: string; mimeType: string; originalName: string }) {
  let body: Buffer;
  try { body = await storage.read(f.storageKey); } catch { throw new HttpError(404, "File not found"); }
  const inline = req.nextUrl.searchParams.get("inline") === "1" && (f.mimeType === "application/pdf" || f.mimeType.startsWith("image/"));
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": f.mimeType,
      "Content-Length": String(body.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(f.originalName)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
