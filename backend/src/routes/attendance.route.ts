// =============================================================================
// backend/src/routes/attendance.route.ts
// =============================================================================
import { Router } from "express";
import { authenticate, authorizeRole } from "@middleware/auth";
import { attendanceController } from "@controllers/attendance.controller";
import { validate } from "@middleware/validate";
import {
  markAttendanceSchema,
  classAttendanceQuerySchema,
  studentAttendanceQuerySchema,
} from "@validations/attendance.validation";

const router = Router();

// Teacher marks attendance for a class
router.post(
  "/mark",
  authenticate,
  authorizeRole("TEACHER"),
  validate(markAttendanceSchema),
  attendanceController.markAttendance
);

// Get class attendance for a date (teacher/student/parent)
router.get(
  "/class/:classId",
  authenticate,
  authorizeRole("TEACHER", "STUDENT", "PARENT"),
  validate(classAttendanceQuerySchema),
  attendanceController.getClassAttendance
);

// Get student attendance history (student/parent/teacher)
router.get(
  "/student/:studentId",
  authenticate,
  authorizeRole("TEACHER", "STUDENT", "PARENT"),
  validate(studentAttendanceQuerySchema),
  attendanceController.getStudentAttendance
);

export default router;
