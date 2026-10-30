// =============================================================================
// backend/src/repositories/homework.repository.ts
// =============================================================================
import { prisma } from "@config/db";

export const homeworkRepository = {
  create: async (data: {
    classId: string;
    subjectId: string;
    teacherId: string;
    title: string;
    description: string;
    dueDate: Date;
    attachmentUrl?: string | null;
  }) =>
    prisma.homework.create({
      data: {
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        attachmentUrl: data.attachmentUrl || null,
      },
      include: {
        class: { select: { name: true, section: true } },
      },
    }),

  findByClass: async (classId: string) =>
    prisma.homework.findMany({
      where: { classId },
      include: {
        class: { select: { name: true, section: true } },
      },
      orderBy: { dueDate: "asc" },
    }),

  findById: (id: string) =>
    prisma.homework.findUnique({ where: { id } }),
};
