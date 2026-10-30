// =============================================================================
// backend/src/routes/auth.route.ts - Auth routes
// =============================================================================
import { Router } from "express";
import { authController } from "@controllers/auth.controller";
import { requestOtpSchema, verifyOtpSchema, refreshTokenSchema } from "@validations/auth.validation";
import { otpRequestLimiter } from "@middleware/rateLimiter";
import { validate } from "@middleware/validate";

const router = Router();

router.post(
  "/request-otp",
  otpRequestLimiter,
  validate(requestOtpSchema),
  authController.requestOtp
);

router.post(
  "/verify-otp",
  validate(verifyOtpSchema),
  authController.verifyOtp
);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refresh
);

export default router;
