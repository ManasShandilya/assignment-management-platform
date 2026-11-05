import bcrypt from "bcryptjs";
import { createHash, randomBytes, timingSafeEqual } from "crypto";

const COST = 12;
export const hashPassword = (plain: string) => bcrypt.hash(plain, COST);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
export const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", COST);

export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
export const newToken = () => randomBytes(32).toString("hex");
export function safeEqual(a: string, b: string) {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}
