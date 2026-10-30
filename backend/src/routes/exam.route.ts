// =============================================================================
// backend/src/routes/exam.route.ts
// =============================================================================
import { Router } from "express";
import { authenticate, authorizeRole } from "@middleware/auth";
import { examController } from "@controllers/exam.controller";
import { validate } from "@middleware/validate";
import { createExamSchema, enterMarksSchema } from "@validations/exam.validation";

const router = Router();

// Admin creates an exam
router.post(
  "/",
  authenticate,
  authorizeRole("ADMIN"),
  validate(createExamSchema),
  examController.createExam
);

// Get exams for a class
router.get(
  "/class/:classId",
  authenticate,
  authorizeRole("ADMIN", "TEACHER", "STUDENT", "PARENT"),
  examController.getExamsByClass
);

// Teacher enters marks for an exam
router.post(
  "/:examId/marks",
  authenticate,
  authorizeRole("TEACHER"),
  validate(enterMarksSchema),
  examController.enterMarks
);

// Get results for a student in an exam
router.get(
  "/:examId/results/:studentId",
  authenticate,
  authorizeRole("ADMIN", "TEACHER", "STUDENT", "PARENT"),
  examController.getResults
);

// Teacher: get marks for entry (exam + subject)
router.get(
  "/:examId/subject/:subjectId/marks",
  authenticate,
  authorizeRole("TEACHER"),
  examController.getMarksForEntry
);

export default router;
