// =============================================================================
// backend/src/services/users.service.ts - Admin management business logic
// =============================================================================
import { prisma } from "@config/db";
import {
  schoolRepository,
  classRepository,
  subjectRepository,
  teacherRepository,
  studentRepository,
  parentRepository,
  userRepository,
} from "@repositories/user.repository";
import { AppError } from "@middleware/errorHandler";

export const usersService = {
  // --- School ---
  createSchool: (data: { name: string; address: string; phone: string }) =>
    schoolRepository.create(data),

  getSchools: () => schoolRepository.findMany(),

  getSchoolById: (id: string) => schoolRepository.findById(id),

  // --- Classes ---
  createClass: async (schoolId: string, data: { name: string; section: string }) => {
    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new AppError("School not found", 404, "SCHOOL_NOT_FOUND");
    return classRepository.create(schoolId, data);
  },

  getClasses: (schoolId: string) => classRepository.findMany(schoolId),

  // --- Subjects ---
  createSubject: (name: string) => subjectRepository.upsert(name),
  getSubjects: () => subjectRepository.findMany(),

  // --- Teachers ---
  createTeacher: (schoolId: string, data: {
    name: string;
    phone: string;
    subjectIds: string[];
    classIds: string[];
  }) => teacherRepository.create({ ...data, schoolId }),

  getTeachers: (schoolId: string) => teacherRepository.findMany(schoolId),

  // --- Students ---
  createStudent: async (schoolId: string, data: {
    name: string;
    rollNumber: string;
    dateOfBirth: string;
    classId: string;
    parentId?: string;
  }) => {
    const cls = await prisma.class.findUnique({ where: { id: data.classId } });
    if (!cls || cls.schoolId !== schoolId) throw new AppError("Class not found", 404, "CLASS_NOT_FOUND");
    return studentRepository.create(data);
  },

  getStudents: (schoolId: string, classId?: string) =>
    studentRepository.findMany(schoolId, classId),

  // --- Parents ---
  createParent: (schoolId: string, data: {
    name: string;
    phone: string;
    studentIds: string[];
  }) => parentRepository.create({ ...data, schoolId }),

  getParents: (schoolId: string) => parentRepository.findMany(schoolId),

  // Parent's own children (read-only, parent-scoped)
  getChildren: async (parentUserId: string) => {
    const parent = await prisma.parent.findUnique({
      where: { userId: parentUserId },
      include: { students: { include: { class: true }, orderBy: { rollNumber: "asc" } } },
    });
    if (!parent) throw new AppError("Parent not found", 404, "PARENT_NOT_FOUND");
    return parent.students;
  },

  // --- Users ---
  getUsers: (schoolId: string) =>
    prisma.user.findMany({
      where: { schoolId },
      orderBy: { role: "asc", name: "asc" },
      include: { teacherProfile: true, studentProfile: true, parentProfile: true },
    }),

  deactivateUser: async (userId: string, schoolId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.schoolId !== schoolId) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    return userRepository.deactivate(userId);
  },
};
