// =============================================================================
// @sms/api/src/modules/users/users.route.ts - Admin user/school/class routes
// All routes require ADMIN role.
// =============================================================================
import { Router } from "express";
import { authenticate, authorizeRole } from "@middleware/auth";
import { usersController } from "./users.controller";
import {
  schoolSchema,
  classSchema,
  subjectSchema,
  teacherSchema,
  studentSchema,
  parentSchema,
} from "./users.validation";

const router = Router();

// All routes in this file: authenticated + ADMIN only
router.use(authenticate, authorizeRole("ADMIN"));

function validate(schema: any) {
  return (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

// --- School ---
router.get("/schools", usersController.getSchools);
router.post("/schools", validate(schoolSchema), usersController.createSchool);

// --- Classes ---
router.get("/schools/:schoolId/classes", usersController.getClasses);
router.post("/schools/:schoolId/classes", validate(classSchema), usersController.createClass);

// --- Subjects ---
router.get("/subjects", usersController.getSubjects);
router.post("/subjects", validate(subjectSchema), usersController.createSubject);

// --- Teachers ---
router.get("/schools/:schoolId/teachers", usersController.getTeachers);
router.post("/schools/:schoolId/teachers", validate(teacherSchema), usersController.createTeacher);

// --- Students ---
router.get("/schools/:schoolId/students", usersController.getStudents);
router.post("/schools/:schoolId/students", validate(studentSchema), usersController.createStudent);

// --- Parents ---
router.get("/schools/:schoolId/parents", usersController.getParents);
router.post("/schools/:schoolId/parents", validate(parentSchema), usersController.createParent);

// --- Users ---
router.get("/schools/:schoolId/users", usersController.getUsers);
router.delete("/schools/:schoolId/users/:userId", usersController.deactivateUser);

export default router;
