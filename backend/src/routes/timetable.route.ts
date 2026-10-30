// =============================================================================
// backend/src/routes/timetable.route.ts
// =============================================================================
import { Router } from "express";
import { authenticate, authorizeRole } from "@middleware/auth";
import { timetableController } from "@controllers/timetable.controller";
import { validate } from "@middleware/validate";
import { createTimetableSchema } from "@validations/timetable.validation";

const router = Router();

// Admin sets timetable for a class
router.post(
  "/",
  authenticate,
  authorizeRole("ADMIN"),
  validate(createTimetableSchema),
  timetableController.setTimetable
);

// Get class timetable (full week schedule)
router.get(
  "/class/:classId",
  authenticate,
  authorizeRole("ADMIN", "TEACHER", "STUDENT", "PARENT"),
  timetableController.getClassTimetable
);

// Get teacher's personal schedule across classes
router.get(
  "/teacher/:teacherId",
  authenticate,
  authorizeRole("ADMIN", "TEACHER", "STUDENT", "PARENT"),
  timetableController.getTeacherTimetable
);

// Get next period for a class
router.get(
  "/class/:classId/next",
  authenticate,
  authorizeRole("ADMIN", "TEACHER", "STUDENT", "PARENT"),
  timetableController.getNextPeriodForClass
);

// Get next period for a teacher
router.get(
  "/teacher/:teacherId/next",
  authenticate,
  authorizeRole("ADMIN", "TEACHER", "STUDENT", "PARENT"),
  timetableController.getNextPeriodForTeacher
);

export default router;
