// Edge-safe: imports only `jose`, so middleware can use it too.
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "session";
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
export type Role = "FACULTY" | "STUDENT";
export interface TokenPayload { sub: string; role: Role; sv: number }

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET must be set to a string of at least 32 characters");
  return new TextEncoder().encode(s);
}

export function signToken(p: TokenPayload) {
  return new SignJWT({ role: p.role, sv: p.sv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const { sub, role, sv } = payload;
    if (typeof sub !== "string" || typeof sv !== "number") return null;
    if (role !== "FACULTY" && role !== "STUDENT") return null;
    return { sub, role, sv };
  } catch {
    return null;
  }
}

export const homeFor = (role: Role) => (role === "FACULTY" ? "/faculty/dashboard" : "/student/dashboard");
