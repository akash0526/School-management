// =============================================================================
// backend/src/validations/exam.validation.ts
// =============================================================================
import { z } from "zod";

export const createExamSchema = z.object({
  name: z.string().min(1, "Exam name is required").max(200),
  classId: z.string().min(1, "Class ID is required"),
  subjects: z.array(z.string()).min(1, "At least one subject is required"),
});

export const enterMarksSchema = z.object({
  records: z.array(
    z.object({
      studentId: z.string().min(1, "Student ID is required"),
      subjectId: z.string().min(1, "Subject ID is required"),
      score: z.number().min(0, "Score cannot be negative"),
      fullMarks: z.number().positive("Full marks must be positive"),
    })
  ).min(1, "At least one mark record is required"),
});

export const examResultsQuerySchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
});
