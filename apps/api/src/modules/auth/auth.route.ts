// =============================================================================
// @sms/api/src/modules/auth/auth.route.ts - Auth routes
// =============================================================================
import { Router } from "express";
import { authController } from "./auth.controller";
import { requestOtpSchema, verifyOtpSchema, refreshTokenSchema } from "./auth.validation";
import { otpRequestLimiter } from "@middleware/rateLimiter";

const router = Router();

// POST /api/auth/request-otp
router.post("/request-otp", otpRequestLimiter, (req, res, next) => {
  try {
    const parsed = requestOtpSchema.parse(req.body);
    req.body = parsed;
    next();
  } catch (err) {
    next(err);
  }
}, authController.requestOtp);

// POST /api/auth/verify-otp
router.post("/verify-otp", (req, res, next) => {
  try {
    const parsed = verifyOtpSchema.parse(req.body);
    req.body = parsed;
    next();
  } catch (err) {
    next(err);
  }
}, authController.verifyOtp);

// POST /api/auth/refresh
router.post("/refresh", (req, res, next) => {
  try {
    const parsed = refreshTokenSchema.parse(req.body);
    req.body = parsed;
    next();
  } catch (err) {
    next(err);
  }
}, authController.refresh);

export default router;
