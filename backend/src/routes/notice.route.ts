// =============================================================================
// backend/src/routes/notice.route.ts
// =============================================================================
import { Router } from "express";
import { authenticate, authorizeRole } from "@middleware/auth";
import { noticeController } from "@controllers/notice.controller";
import { validate } from "@middleware/validate";
import { createNoticeSchema, noticeQuerySchema } from "@validations/notice.validation";

const router = Router();

// Admin creates a notice
router.post(
  "/",
  authenticate,
  authorizeRole("ADMIN"),
  validate(createNoticeSchema),
  noticeController.createNotice
);

// Get notices relevant to logged-in user
router.get(
  "/",
  authenticate,
  authorizeRole("ADMIN", "TEACHER", "STUDENT", "PARENT"),
  validate(noticeQuerySchema),
  noticeController.getNotices
);

// Admin: get all notices for school
router.get(
  "/all",
  authenticate,
  authorizeRole("ADMIN"),
  noticeController.getAllNotices
);

export default router;
