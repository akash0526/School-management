// =============================================================================
// @sms/api/src/middleware/rateLimiter.ts - OTP rate limiting
// Security: max 3 OTP requests per phone number per 10 minutes.
// =============================================================================
import rateLimit from "express-rate-limit";

export const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // max 3 requests per phone per window
  message: {
    success: false,
    error: { message: "Too many OTP requests. Try again after 10 minutes.", code: "OTP_RATE_LIMITED" },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use phone number as the rate-limit key when available
  keyGenerator: (req) => {
    const phone = (req.body as { phone?: string }).phone || req.ip || "unknown";
    return `otp:${phone}`;
  },
  skipSuccessfulRequests: false,
});

export const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    success: false,
    error: { message: "Too many requests, please slow down.", code: "RATE_LIMITED" },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
