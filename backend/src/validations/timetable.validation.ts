// =============================================================================
// backend/src/validations/timetable.validation.ts
// =============================================================================
import { z } from "zod";

const periodSchema = z.object({
  day: z.enum([
    "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
  ]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:MM"),
  subjectId: z.string().min(1, "Subject ID is required"),
  teacherId: z.string().min(1, "Teacher ID is required"),
});

export const createTimetableSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  periods: z.array(periodSchema).min(1, "At least one period is required"),
});

export const timetableQuerySchema = z.object({
  classId: z.string().optional(),
  teacherId: z.string().optional(),
});
