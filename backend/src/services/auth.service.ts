// =============================================================================
// backend/src/services/auth.service.ts - Auth business logic
// OTP-based login via phone (no passwords). JWT access + refresh tokens.
// =============================================================================
import jwt, { SignOptions } from "jsonwebtoken";
import { sendSms } from "./sms.service";
import { userRepository } from "@repositories/user.repository";
import { prisma } from "@config/db";
import { env } from "@config/env";
import { logInfo } from "@utils/logger";
import type { Role, JwtPayload } from "@shared-types/shared";

const OTP_EXPIRY_MINUTES = 10;

// In-memory OTP store (dev). Production should use Redis/DB.
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createAccessToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function createRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export async function requestOtp(phone: string): Promise<{ success: boolean; otp?: string }> {
  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
  otpStore.set(phone, { otp, expiresAt });

  const body = `Your School Management System OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;
  const result = await sendSms(phone, body);

  logInfo("OTP requested", { phone, mock: result.messageId?.startsWith("mock") });

  return {
    success: true,
    otp: env.SMS_MOCK_MODE ? otp : undefined,
  };
}

export async function verifyOtp(phone: string, otp: string): Promise<{
  success: boolean;
  tokens?: { accessToken: string; refreshToken: string };
  user?: { id: string; phone: string; name: string; role: Role; schoolId: string };
  error?: string;
}> {
  const record = otpStore.get(phone);
  if (!record) {
    return { success: false, error: "OTP not found or expired" };
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return { success: false, error: "OTP expired" };
  }
  if (record.otp !== otp) {
    return { success: false, error: "Invalid OTP" };
  }

  otpStore.delete(phone);

  let user = await userRepository.findByPhone(phone);

  if (!user) {
    // Auto-create a parent user for first-time login
    const zeroSchoolId = "00000000-0000-0000-0000-000000000000";
    const created = await userRepository.create({
      phone,
      name: phone,
      role: "PARENT",
      schoolId: zeroSchoolId,
    });
    user = created;
    logInfo("Auto-created user on first login", { phone, role: user.role });
  }

  if (!user.isActive) {
    return { success: false, error: "Account is deactivated" };
  }

  // Resolve profile-specific ids for role-scoped endpoints
  let classId: string | undefined;
  let teacherId: string | undefined;
  if (user.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: user.id }, select: { id: true, classId: true } });
    classId = student?.classId;
  } else if (user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id }, select: { id: true } });
    teacherId = teacher?.id;
  }

  const tokens = {
    accessToken: createAccessToken({
      userId: user.id,
      phone: user.phone,
      role: user.role as Role,
      schoolId: user.schoolId,
      ...(classId ? { classId } : {}),
      ...(teacherId ? { teacherId } : {}),
    }),
    refreshToken: createRefreshToken({
      userId: user.id,
      phone: user.phone,
      role: user.role as Role,
      schoolId: user.schoolId,
      ...(classId ? { classId } : {}),
      ...(teacherId ? { teacherId } : {}),
    }),
  };

  return {
    success: true,
    tokens,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role as Role,
      schoolId: user.schoolId,
    },
  };
}

export function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  return new Promise((resolve, reject) => {
    jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) return reject(new Error("Invalid or expired refresh token"));
      const payload = decoded as JwtPayload;
      const accessToken = createAccessToken(payload);
      resolve({ accessToken });
    });
  });
}
