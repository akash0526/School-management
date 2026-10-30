// =============================================================================
// @sms/api/src/modules/auth/auth.service.ts - Auth business logic
// OTP-based login via phone (no passwords). JWT access + refresh tokens.
// =============================================================================
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "@config/db";
import { sendSms } from "@services/sms.service";
import { logInfo, logError } from "@utils/logger";
import { env } from "@config/env";
import { Role } from "@shared-types";

const OTP_EXPIRY_MINUTES = 10;

/** In-memory OTP store (dev). In production use Redis/DB. */
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createAccessToken(payload: { userId: string; phone: string; role: Role; schoolId: string }): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function createRefreshToken(payload: { userId: string; phone: string; role: Role; schoolId: string }): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export async function requestOtp(phone: string): Promise<{ success: boolean; otp?: string; error?: string }> {
  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
  otpStore.set(phone, { otp, expiresAt });

  const body = `Your School Management System OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;
  const result = await sendSms(phone, body);

  logInfo("OTP requested", { phone, otp, mock: result.messageId?.startsWith("mock") });

  return {
    success: true,
    // In dev/mock mode, expose OTP so it's testable without a real SMS gateway
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

  // OTP valid — consume it
  otpStore.delete(phone);

  // Find or create user by phone. Default new users to PARENT role unless they exist.
  let user = await prisma.user.findUnique({ where: { phone }, include: { school: true } });

  if (!user) {
    // Auto-create a parent user for first-time login (school linking done by admin later)
    user = await prisma.user.create({
      data: { phone, name: phone, role: "PARENT", schoolId: "00000000-0000-0000-0000-000000000000" },
      include: { school: true },
    });
    logInfo("Auto-created user on first login", { phone, role: user.role });
  }

  if (!user.isActive) {
    return { success: false, error: "Account is deactivated" };
  }

  const tokens = {
    accessToken: createAccessToken({
      userId: user.id,
      phone: user.phone,
      role: user.role as Role,
      schoolId: user.schoolId,
    }),
    refreshToken: createRefreshToken({
      userId: user.id,
      phone: user.phone,
      role: user.role as Role,
      schoolId: user.schoolId,
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
      const payload = decoded as { userId: string; phone: string; role: Role; schoolId: string };
      const accessToken = createAccessToken(payload);
      resolve({ accessToken });
    });
  });
}

export default {
  generateOtp,
  requestOtp,
  verifyOtp,
  refreshAccessToken,
  createAccessToken,
  createRefreshToken,
};
