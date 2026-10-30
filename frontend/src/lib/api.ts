// =============================================================================
// frontend/src/lib/api.ts - API client with JWT auth (frontend layer)
// =============================================================================
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  role: Role;
  schoolId: string;
  classId?: string;   // STUDENT: their class
  teacherId?: string; // TEACHER: their teacher profile
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sms_access_token");
}

export function setTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("sms_access_token", tokens.accessToken);
  localStorage.setItem("sms_refresh_token", tokens.refreshToken);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("sms_access_token");
  localStorage.removeItem("sms_refresh_token");
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("sms_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("sms_user", JSON.stringify(user));
}

export async function apiRequest(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${input}`, {
    ...init,
    headers,
  } as RequestInit);

  return res;
}

export async function requestOtp(phone: string) {
  const res = await apiRequest("/api/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
  return res.json();
}

export async function verifyOtp(phone: string, otp: string) {
  const res = await apiRequest("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Verification failed");
  setTokens(data.data.tokens);
  setCurrentUser(data.data.user);
  return data.data;
}

export async function refreshToken() {
  const res = await apiRequest("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: localStorage.getItem("sms_refresh_token") }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Refresh failed");
  localStorage.setItem("sms_access_token", data.data.accessToken);
  return data.data.accessToken;
}

export function logout() {
  clearTokens();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

// =============================================================================
// Attendance API
// =============================================================================
export interface AttendanceRecord {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE";
}

export interface MarkAttendanceBody {
  classId: string;
  date: string;
  records: AttendanceRecord[];
}

export interface StudentAttendanceItem {
  id: string;
  name: string;
  rollNumber: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  parentPhone?: string | null;
  parentName?: string | null;
}

export async function markAttendance(body: MarkAttendanceBody) {
  const res = await apiRequest("/api/attendance/mark", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getClassAttendance(classId: string, date?: string) {
  const url = `/api/attendance/class/${classId}` + (date ? `?date=${date}` : "");
  const res = await apiRequest(url);
  return res.json();
}

export async function getStudentAttendance(studentId: string, month?: string) {
  const url = `/api/attendance/student/${studentId}` + (month ? `?month=${month}` : "");
  const res = await apiRequest(url);
  return res.json();
}

// =============================================================================
// Notice API
// =============================================================================
export interface Notice {
  id: string;
  title: string;
  content: string;
  targetRole?: string | null;
  targetClassId?: string | null;
  createdAt: string;
  sendSms: boolean;
  school?: { name: string };
}

export interface CreateNoticeBody {
  title: string;
  content: string;
  targetRole?: string;
  targetClassId?: string;
  sendSms?: boolean;
}

export async function createNotice(body: CreateNoticeBody) {
  const res = await apiRequest("/api/notices", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getNotices(role?: string, classId?: string) {
  const url = `/api/notices` + (role || classId ? `?role=${role || ""}&classId=${classId || ""}` : "");
  const res = await apiRequest(url);
  return res.json();
}

export async function getAllNotices() {
  const res = await apiRequest("/api/notices/all");
  return res.json();
}

// =============================================================================
// Homework API
// =============================================================================
export interface Homework {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  attachmentUrl: string | null;
  dueDate: string;
  createdAt: string;
  class?: { name: string; section: string };
  subject?: { name: string };
}

export interface CreateHomeworkBody {
  classId: string;
  subjectId: string;
  title: string;
  description: string;
  dueDate: string;
  attachmentUrl?: string | null;
}

export async function createHomework(body: CreateHomeworkBody) {
  const res = await apiRequest("/api/homework", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getHomeworkByClass(classId: string) {
  const res = await apiRequest(`/api/homework/class/${classId}`);
  return res.json();
}

// =============================================================================
// Upload API
// =============================================================================
export async function uploadFile(formData: FormData) {
  const res = await apiRequest("/api/upload", {
    method: "POST",
    body: formData,
    headers: {}, // let browser set Content-Type for multipart
  } as RequestInit);
  return res.json();
}

// =============================================================================
// Message API
// =============================================================================
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

export interface CreateMessageBody {
  receiverId: string;
  content: string;
}

export interface Contact {
  id: string;
  phone: string;
  name: string;
  role: Role;
}

export async function sendMessage(body: CreateMessageBody) {
  const res = await apiRequest("/api/messages", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getMessageThread(userId: string) {
  const res = await apiRequest(`/api/messages/thread/${userId}`);
  return res.json();
}

export async function getMessageContacts() {
  const res = await apiRequest("/api/messages/contacts");
  return res.json();
}

// =============================================================================
// Exam API
// =============================================================================
export interface Exam {
  id: string;
  name: string;
  classId: string;
  createdAt: string;
}

export interface CreateExamBody {
  name: string;
  classId: string;
  subjects: string[];
}

export interface MarkRecord {
  studentId: string;
  subjectId: string;
  score: number;
  fullMarks: number;
}

export interface EnterMarksBody {
  records: MarkRecord[];
}

export interface MarkEntryItem {
  id: string;
  studentId: string;
  student: { id: string; name: string; rollNumber: string };
  subjectId: string;
  score: number | null;
  fullMarks: number | null;
  grade: string | null;
}

export interface ExamResult {
  subject: string;
  score: number;
  fullMarks: number;
  grade: string;
  gpa: number;
}

export interface ExamResultsData {
  exam: { name: string; classId: string };
  student: { id: string; name: string; rollNumber: string };
  results: ExamResult[];
  total: number;
  totalMarks: number;
  percentage: number;
  gpa: number;
}

export async function createExam(body: CreateExamBody) {
  const res = await apiRequest("/api/exams", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getExamsByClass(classId: string) {
  const res = await apiRequest(`/api/exams/class/${classId}`);
  return res.json();
}

export async function enterMarks(examId: string, body: EnterMarksBody) {
  const res = await apiRequest(`/api/exams/${examId}/marks`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getMarksForEntry(examId: string, subjectId: string) {
  const res = await apiRequest(`/api/exams/${examId}/subject/${subjectId}/marks`);
  return res.json();
}

export async function getExamResults(examId: string, studentId: string) {
  const res = await apiRequest(`/api/exams/${examId}/results/${studentId}`);
  return res.json();
}

export async function downloadReportCard(examId: string, studentId: string) {
  const res = await fetch(`${API_URL}/api/pdf/report-card/${examId}/${studentId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("sms_access_token")}`,
    },
  });
  return res;
}

// =============================================================================
// Timetable API
// =============================================================================
export interface TimetablePeriod {
  id: string;
  classId: string;
  day: string;
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId: string;
  subject?: { name: string };
  teacher?: { user: { name: string } };
  class?: { id: string; name: string; section: string };
}

export interface CreateTimetableBody {
  classId: string;
  periods: Array<{
    day: string;
    startTime: string;
    endTime: string;
    subjectId: string;
    teacherId: string;
  }>;
}

export async function setTimetable(body: CreateTimetableBody) {
  const res = await apiRequest("/api/timetable", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getClassTimetable(classId: string) {
  const res = await apiRequest(`/api/timetable/class/${classId}`);
  return res.json();
}

export async function getTeacherTimetable(teacherId: string) {
  const res = await apiRequest(`/api/timetable/teacher/${teacherId}`);
  return res.json();
}

export async function getNextPeriodForClass(classId: string, day: string, time: string) {
  const res = await apiRequest(`/api/timetable/class/${classId}/next?day=${day}&time=${time}`);
  return res.json();
}
