import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

// Browsers always send Origin on cross-site POSTs; reject if it isn't our own host.
function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) {
    throw new HttpError(403, "Cross-site request blocked");
  }
}

export function apiHandler<C = unknown>(fn: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C) => {
    try {
      if (!["GET", "HEAD"].includes(req.method)) assertSameOrigin(req);
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message, fields: e.fields }, { status: e.status });
      if (e instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const i of e.issues) fields[i.path.join(".")] ??= i.message;
        return NextResponse.json({ error: "Check the highlighted fields", fields }, { status: 400 });
      }
      console.error(e);
      return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
    }
  };
}

export async function readJson(req: NextRequest) {
  try { return await req.json(); } catch { throw new HttpError(400, "Invalid request body"); }
}
