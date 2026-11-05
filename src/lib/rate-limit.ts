import { HttpError } from "./errors";

// In-memory: fine for one server instance. Swap for Redis/Upstash when you deploy several.
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { count: 1, reset: now + windowMs }); return; }
  if (++h.count > max) throw new HttpError(429, "Too many attempts. Wait a few minutes and try again.");
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
