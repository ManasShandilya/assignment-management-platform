import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address");
export const passwordRule = z.string()
  .min(8, "Use at least 8 characters").max(72, "Use 72 characters or fewer")
  .regex(/[A-Za-z]/, "Include at least one letter").regex(/\d/, "Include at least one number");
const name = z.string().trim().min(2, "Enter your full name").max(80);
const text = (label: string) => z.string().trim().min(2, `Enter ${label}`).max(60);

export const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password") });

// `role` is only a selector. Faculty needs the invite code, and the student's
// program and semester come from the chosen section, never from the client.
export const registerSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("STUDENT"), name, email, password: passwordRule,
    regNo: z.string().trim().min(3, "Enter your registration number").max(20),
    sectionId: z.string().min(1, "Choose your section"), branch: text("your branch"),
  }),
  z.object({
    role: z.literal("FACULTY"), name, email, password: passwordRule,
    inviteCode: z.string().min(1, "Enter the faculty invite code"),
    facultyCode: z.string().trim().min(2, "Enter your faculty ID").max(20),
    department: text("your department"), designation: text("your designation"),
  }),
]);

export const forgotSchema = z.object({ email });
export const resetSchema = z.object({ token: z.string().min(32), password: passwordRule });
export type RegisterInput = z.infer<typeof registerSchema>;
