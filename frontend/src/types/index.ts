// =============================================================================
// frontend/src/types/index.ts - Shared types (copy of shared/ for Vercel build)
// =============================================================================

export type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  phone: string;
  role: Role;
  schoolId: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  role: Role;
  schoolId: string;
  isActive: boolean;
}

export interface GradeResult {
  grade: string;
  gpa: number;
}

export interface MarkInput {
  studentId: string;
  subjectId: string;
  score: number;
  fullMarks: number;
}

export interface SmsSendRequest {
  to: string;
  body: string;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const GRADE_BOUNDARIES: Array<{
  min: number;
  max: number;
  grade: string;
  gpa: number;
}> = [
  { min: 90, max: 100, grade: "A+", gpa: 4.0 },
  { min: 80, max: 89, grade: "A", gpa: 3.6 },
  { min: 70, max: 79, grade: "B+", gpa: 3.2 },
  { min: 60, max: 69, grade: "B", gpa: 2.8 },
  { min: 50, max: 59, grade: "C+", gpa: 2.4 },
  { min: 40, max: 49, grade: "C", gpa: 2.0 },
  { min: 35, max: 39, grade: "D+", gpa: 1.6 },
  { min: 20, max: 34, grade: "D", gpa: 1.2 },
  { min: 0, max: 19, grade: "NG", gpa: 0.0 },
];

export function calculateGrade(score: number, fullMarks: number): GradeResult {
  if (fullMarks <= 0) return { grade: "NG", gpa: 0.0 };
  const percentage = (score / fullMarks) * 100;
  for (const boundary of GRADE_BOUNDARIES) {
    if (percentage >= boundary.min && percentage <= boundary.max) {
      return { grade: boundary.grade, gpa: boundary.gpa };
    }
  }
  return { grade: "NG", gpa: 0.0 };
}

export function calculateGPA(results: Array<{ score: number; fullMarks: number }>): number {
  if (results.length === 0) return 0.0;
  const totalGpa = results.reduce((sum, r) => sum + calculateGrade(r.score, r.fullMarks).gpa, 0);
  return Math.round((totalGpa / results.length) * 100) / 100;
}
