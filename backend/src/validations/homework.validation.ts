// =============================================================================
// backend/src/validations/homework.validation.ts
// =============================================================================
import { z } from "zod";

export const createHomeworkSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  subjectId: z.string().min(1, "Subject ID is required"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Due date is required")
    .refine((d) => !isNaN(Date.parse(d)), "Invalid due date"),
  attachmentUrl: z.string().optional().nullable(),
});

export const homeworkQuerySchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
});
