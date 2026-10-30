// =============================================================================
// @sms/api/src/modules/users/users.validation.ts - Zod schemas for user/school/class management
// =============================================================================
import { z } from "zod";

export const schoolSchema = z.object({
  name: z.string().min(1, "School name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone is required"),
});

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
});

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required (e.g. Class 10)"),
  section: z.string().min(1, "Section is required (e.g. A)"),
});

export const teacherSchema = z.object({
  name: z.string().min(1, "Teacher name is required"),
  phone: z.string().min(1, "Phone is required"),
  subjectIds: z.array(z.string()).min(1, "At least one subject is required"),
  classIds: z.array(z.string()).min(1, "At least one class is required"),
});

export const studentSchema = z.object({
  name: z.string().min(1, "Student name is required"),
  rollNumber: z.string().min(1, "Roll number is required"),
  dateOfBirth: z.string().datetime({ message: "Invalid date of birth" }),
  classId: z.string().min(1, "Class is required"),
  parentId: z.string().optional(),
});

export const parentSchema = z.object({
  name: z.string().min(1, "Parent name is required"),
  phone: z.string().min(1, "Phone is required"),
  studentIds: z.array(z.string()).optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});
