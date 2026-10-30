// =============================================================================
// backend/src/routes/users.route.ts - Admin user/school/class routes
// All routes require ADMIN role.
// =============================================================================
import { Router } from "express";
import { authenticate, authorizeRole } from "@middleware/auth";
import { validate } from "@middleware/validate";
import { usersController } from "@controllers/users.controller";
import {
  schoolSchema,
  classSchema,
  subjectSchema,
  teacherSchema,
  studentSchema,
  parentSchema,
} from "@validations/users.validation";

const router = Router();

// All routes: authenticated + ADMIN only
router.use(authenticate, authorizeRole("ADMIN"));

router.get("/schools", usersController.getSchools);
router.post("/schools", validate(schoolSchema), usersController.createSchool);

router.get("/schools/:schoolId/classes", usersController.getClasses);
router.post("/schools/:schoolId/classes", validate(classSchema), usersController.createClass);

router.get("/subjects", usersController.getSubjects);
router.post("/subjects", validate(subjectSchema), usersController.createSubject);

router.get("/schools/:schoolId/teachers", usersController.getTeachers);
router.post("/schools/:schoolId/teachers", validate(teacherSchema), usersController.createTeacher);

router.get("/schools/:schoolId/students", usersController.getStudents);
router.post("/schools/:schoolId/students", validate(studentSchema), usersController.createStudent);

router.get("/schools/:schoolId/parents", usersController.getParents);
router.post("/schools/:schoolId/parents", validate(parentSchema), usersController.createParent);

router.get("/schools/:schoolId/users", usersController.getUsers);
router.delete("/schools/:schoolId/users/:userId", usersController.deactivateUser);

export default router;
