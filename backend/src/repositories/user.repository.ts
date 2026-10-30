// =============================================================================
// backend/src/repositories/user.repository.ts - Data access for users/schools
// Only Prisma queries live here. No business logic.
// =============================================================================
import { prisma } from "@config/db";
import type { Role } from "@shared-types/shared";

export const userRepository = {
  findByPhone: (phone: string) =>
    prisma.user.findUnique({ where: { phone }, include: { school: true } }),

  create: (data: {
    phone: string;
    name: string;
    role: Role;
    schoolId: string;
  }) =>
    prisma.user.create({
      data,
      include: { school: true },
    }),

  findById: (id: string) =>
    prisma.user.findUnique({ where: { id }, include: { school: true } }),

  update: (id: string, data: { name?: string; phone?: string; isActive?: boolean }) =>
    prisma.user.update({ where: { id }, data }),

  deactivate: (id: string) =>
    prisma.user.update({ where: { id }, data: { isActive: false } }),
};

export const schoolRepository = {
  create: (data: { name: string; address: string; phone: string }) =>
    prisma.school.create({ data }),

  findMany: () =>
    prisma.school.findMany({ orderBy: { createdAt: "desc" } }),

  findById: (id: string) =>
    prisma.school.findUnique({ where: { id } }),
};

export const classRepository = {
  create: (schoolId: string, data: { name: string; section: string }) =>
    prisma.class.create({ data: { ...data, schoolId } }),

  findMany: (schoolId: string) =>
    prisma.class.findMany({
      where: { schoolId },
      include: { students: true, subjects: true },
      orderBy: [{ name: "asc" }, { section: "asc" }],
    }),
};

export const subjectRepository = {
  upsert: (name: string) =>
    prisma.subject.upsert({ where: { name }, update: {}, create: { name } }),

  findMany: () =>
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
};

export const teacherRepository = {
  create: (data: {
    name: string;
    phone: string;
    subjectIds: string[];
    classIds: string[];
    schoolId: string;
  }) =>
    prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { phone: data.phone, name: data.name, role: "TEACHER", schoolId: data.schoolId, isActive: true },
      });
      const teacher = await tx.teacher.create({ data: { userId: user.id } });
      for (const subjectId of data.subjectIds) {
        for (const classId of data.classIds) {
          await tx.teacherSubjectClass.create({
            data: { teacherId: teacher.id, subjectId, classId },
          });
        }
      }
      return { user, teacher };
    }),

  findMany: (schoolId: string) =>
    prisma.teacher.findMany({
      where: { user: { schoolId } },
      include: {
        user: true,
        subjects: { include: { subject: true, class: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
};

export const studentRepository = {
  create: (data: {
    name: string;
    rollNumber: string;
    dateOfBirth: string;
    classId: string;
    parentId?: string;
  }) =>
    prisma.student.create({
      data: {
        name: data.name,
        rollNumber: data.rollNumber,
        dateOfBirth: new Date(data.dateOfBirth),
        classId: data.classId,
        parentId: data.parentId || null,
      },
      include: { class: true, parent: true },
    }),

  findMany: (schoolId: string, classId?: string) =>
    prisma.student.findMany({
      where: { class: { schoolId }, ...(classId ? { classId } : {}) },
      include: { class: true, parent: true },
      orderBy: { rollNumber: "asc" },
    }),
};

export const parentRepository = {
  create: (data: {
    name: string;
    phone: string;
    studentIds: string[];
    schoolId: string;
  }) =>
    prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { phone: data.phone, name: data.name, role: "PARENT", schoolId: data.schoolId, isActive: true },
      });
      const parent = await tx.parent.create({ data: { userId: user.id } });
      for (const studentId of data.studentIds) {
        await tx.student.update({
          where: { id: studentId },
          data: { parentId: parent.id },
        });
      }
      return { user, parent };
    }),

  findMany: (schoolId: string) =>
    prisma.parent.findMany({
      where: { user: { schoolId } },
      include: { user: true, students: { include: { class: true } } },
      orderBy: { user: { name: "asc" } },
    }),
};
