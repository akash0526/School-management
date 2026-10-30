// =============================================================================
// backend/src/validations/attendance.validation.ts
// =============================================================================
import { z } from "zod";

export const markAttendanceSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  records: z.array(
    z.object({
      studentId: z.string().min(1, "Student ID is required"),
      status: z.enum(["PRESENT", "ABSENT", "LATE"]),
    })
  ).min(1, "At least one attendance record is required"),
});

export const classAttendanceQuerySchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
});

export const studentAttendanceQuerySchema = z.object({
  month: z.string()
    .regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM")
    .optional(),
});
