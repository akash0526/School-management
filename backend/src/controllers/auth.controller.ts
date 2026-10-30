// =============================================================================
// backend/src/controllers/auth.controller.ts - Auth HTTP layer
// Parses request, calls service, returns response.
// =============================================================================
import { Request, Response } from "express";
import { requestOtp, verifyOtp, refreshAccessToken } from "@services/auth.service";

export const authController = {
  requestOtp: async (req: Request, res: Response): Promise<Response> => {
    const { phone } = req.body as { phone: string };
    const result = await requestOtp(phone);
    return res.json({ success: true, data: { otp: result.otp, message: "OTP sent successfully" } });
  },

  verifyOtp: async (req: Request, res: Response): Promise<Response> => {
    const { phone, otp } = req.body as { phone: string; otp: string };
    const result = await verifyOtp(phone, otp);
    if (!result.success) {
      return res.status(401).json({ success: false, error: { message: result.error || "Verification failed", code: "VERIFICATION_FAILED" } });
    }
    return res.json({
      success: true,
      data: { tokens: result.tokens, user: result.user },
    });
  },

  refresh: async (req: Request, res: Response): Promise<Response> => {
    const { refreshToken } = req.body as { refreshToken: string };
    try {
      const { accessToken } = await refreshAccessToken(refreshToken);
      return res.json({ success: true, data: { accessToken } });
    } catch {
      return res.status(401).json({ success: false, error: { message: "Invalid or expired refresh token", code: "INVALID_REFRESH" } });
    }
  },
};
