// =============================================================================
// @sms/web/src/lib/api.ts - API client with JWT auth
// =============================================================================
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  role: Role;
  schoolId: string;
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

export async function apiRequest(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${String(input).startsWith("http") ? "" : ""}${input}`, {
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

export async function logout() {
  clearTokens();
  window.location.href = "/login";
}
