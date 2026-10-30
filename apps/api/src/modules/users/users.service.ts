// =============================================================================
// @sms/api/src/modules/users/users.service.ts - Admin management business logic
// School, Classes, Teachers, Students, Parents
// =============================================================================
import { prisma } from "@config/db";
import { PrismaClient } from "@prisma/client";
import { Role } from "@shared-types";
import { AppError } from "@middleware/errorHandler";

const ZERO_SCHOOL_ID = "00000000-0000-0000-0000-000000000000";

/** ---------- School ---------- */
export async function createSchool(data: { name: string; address: string; phone: string }) {
  return prisma.school.create({ data });
}

export async function getSchools() {
  return prisma.school.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getSchoolById(id: string) {
  return prisma.school.findUnique({ where: { id } });
}

/** ---------- Classes ---------- */
export async function createClass(schoolId: string, data: { name: string; section: string }) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new AppError("School not found", 404, "SCHOOL_NOT_FOUND");
  return prisma.class.create({
    data: { name: data.name, section: data.section, schoolId },
  });
}

export async function getClasses(schoolId: string) {
  return prisma.class.findMany({
    where: { schoolId },
    include: { students: true, subjects: true },
    orderBy: [{ name: "asc" }, { section: "asc" }],
  });
}

/** ---------- Subjects ---------- */
export async function createSubject(name: string) {
  return prisma.subject.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

export async function getSubjects() {
  return prisma.subject.findMany({ orderBy: { name: "asc" } });
}

/** ---------- Teachers ---------- */
export async function createTeacher(schoolId: string, data: {
  name: string;
  phone: string;
  subjectIds: string[];
  classIds: string[];
}) {
  // Check phone uniqueness
  const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existing) throw new AppError("Phone already registered", 400, "PHONE_EXISTS");

  return prisma.$transaction(async (tx: PrismaClient) => {
    const user = await tx.user.create({
      data: { phone: data.phone, name: data.name, role: "TEACHER", schoolId, isActive: true },
    });
    const teacher = await tx.teacher.create({
      data: { userId: user.id },
    });
    // Link teacher-subject-class mappings
    for (const subjectId of data.subjectIds) {
      for (const classId of data.classIds) {
        await tx.teacherSubjectClass.create({
          data: { teacherId: teacher.id, subjectId, classId },
        });
      }
    }
    return { user, teacher };
  });
}

export async function getTeachers(schoolId: string) {
  return prisma.teacher.findMany({
    where: { user: { schoolId } },
    include: {
      user: true,
      subjects: { include: { subject: true, class: true } },
    },
    orderBy: { user: { name: "asc" } },
  });
}

/** ---------- Students ---------- */
export async function createStudent(schoolId: string, data: {
  name: string;
  rollNumber: string;
  dateOfBirth: string;
  classId: string;
  parentId?: string;
}) {
  const cls = await prisma.class.findUnique({ where: { id: data.classId } });
  if (!cls || cls.schoolId !== schoolId) throw new AppError("Class not found", 404, "CLASS_NOT_FOUND");

  return prisma.student.create({
    data: {
      name: data.name,
      rollNumber: data.rollNumber,
      dateOfBirth: new Date(data.dateOfBirth),
      classId: data.classId,
      parentId: data.parentId || null,
    },
    include: { class: true, parent: true },
  });
}

export async function getStudents(schoolId: string, classId?: string) {
  return prisma.student.findMany({
    where: { class: { schoolId }, ...(classId ? { classId } : {}) },
    include: { class: true, parent: true },
    orderBy: { rollNumber: "asc" },
  });
}

/** ---------- Parents ---------- */
export async function createParent(schoolId: string, data: {
  name: string;
  phone: string;
  studentIds: string[];
}) {
  const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existing) throw new AppError("Phone already registered", 400, "PHONE_EXISTS");

  return prisma.$transaction(async (tx: PrismaClient) => {
    const user = await tx.user.create({
      data: { phone: data.phone, name: data.name, role: "PARENT", schoolId, isActive: true },
    });
    const parent = await tx.parent.create({ data: { userId: user.id } });
    // Link students
    for (const studentId of data.studentIds) {
      await tx.student.update({
        where: { id: studentId },
        data: { parentId: parent.id },
      });
    }
    return { user, parent };
  });
}

export async function getParents(schoolId: string) {
  return prisma.parent.findMany({
    where: { user: { schoolId } },
    include: { user: true, students: { include: { class: true } } },
    orderBy: { user: { name: "asc" } },
  });
}

/** ---------- Users (general) ---------- */
export async function getUsers(schoolId: string) {
  return prisma.user.findMany({
    where: { schoolId },
    orderBy: { role: "asc", name: "asc" },
    include: { teacherProfile: true, studentProfile: true, parentProfile: true },
  });
}

export async function deactivateUser(userId: string, schoolId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.schoolId !== schoolId) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return prisma.user.update({ where: { id: userId }, data: { isActive: false } });
}

export default {
  createSchool,
  getSchools,
  getSchoolById,
  createClass,
  getClasses,
  createSubject,
  getSubjects,
  createTeacher,
  getTeachers,
  createStudent,
  getStudents,
  createParent,
  getParents,
  getUsers,
  deactivateUser,
};
