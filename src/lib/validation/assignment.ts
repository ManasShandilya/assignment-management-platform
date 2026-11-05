import { z } from "zod";

export const assignmentSchema = z.object({
  subjectId: z.string().min(1, "Choose a class"),
  title: z.string().trim().min(3, "Enter a title of at least 3 characters").max(150),
  description: z.string().trim().min(1, "Add a short description").max(5000),
  instructions: z.string().trim().max(10000).optional().default(""),
  deadline: z.string().datetime({ message: "Choose a deadline" }),
  maxMarks: z.number({ invalid_type_error: "Enter the maximum marks" }).int().min(1, "Enter marks between 1 and 1000").max(1000, "Enter marks between 1 and 1000"),
  allowedFormats: z.array(z.enum(["pdf", "doc", "docx", "ppt", "pptx"])).min(1, "Choose at least one format"),
  maxFileSizeMb: z.number({ invalid_type_error: "Enter a size" }).int().min(1, "Use 1 to 25 MB").max(25, "Use 1 to 25 MB"),
  allowMultiple: z.boolean(),
  allowResubmission: z.boolean(),
  allowLate: z.boolean(),
  latePenaltyPct: z.number().int().min(0, "Use 0 to 100").max(100, "Use 0 to 100"),
  visibility: z.enum(["CLASS", "INDIVIDUAL"]),
  studentIds: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  removeAttachmentIds: z.array(z.string()).default([]),
}).refine((d) => d.visibility === "CLASS" || d.studentIds.length > 0, {
  path: ["studentIds"], message: "Choose at least one student",
});
export type AssignmentInput = z.infer<typeof assignmentSchema>;

export const statusSchema = z.object({ status: z.enum(["DRAFT", "PUBLISHED"]) });
