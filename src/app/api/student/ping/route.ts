import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/errors";
import { requireRole } from "@/lib/auth/guards";

// Minimal protected endpoint used by scripts/security-check.ts.
export const GET = apiHandler(async () => {
  await requireRole("STUDENT");
  return NextResponse.json({ ok: true });
});
