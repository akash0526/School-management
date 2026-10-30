// =============================================================================
// backend/src/validations/notice.validation.ts
// =============================================================================
import { z } from "zod";

export const createNoticeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  targetRole: z.enum(["ADMIN", "TEACHER", "STUDENT", "PARENT"]).optional(),
  targetClassId: z.string().optional(),
  sendSms: z.boolean().optional().default(false),
});

export const noticeQuerySchema = z.object({
  role: z.enum(["ADMIN", "TEACHER", "STUDENT", "PARENT"]).optional(),
  classId: z.string().optional(),
});
