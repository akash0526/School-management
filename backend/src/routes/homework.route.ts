// =============================================================================
// backend/src/routes/homework.route.ts
// =============================================================================
import { Router } from "express";
import { authenticate, authorizeRole } from "@middleware/auth";
import { homeworkController } from "@controllers/homework.controller";
import { validate } from "@middleware/validate";
import { createHomeworkSchema, homeworkQuerySchema } from "@validations/homework.validation";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRole("TEACHER"),
  validate(createHomeworkSchema),
  homeworkController.createHomework
);

router.get(
  "/class/:classId",
  authenticate,
  authorizeRole("TEACHER", "STUDENT", "PARENT"),
  validate(homeworkQuerySchema),
  homeworkController.getHomeworkByClass
);

export default router;
