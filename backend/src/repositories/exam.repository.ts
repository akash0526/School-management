// =============================================================================
// backend/src/repositories/exam.repository.ts
// =============================================================================
import { prisma } from "@config/db";

export const examRepository = {
  create: async (data: {
    name: string;
    classId: string;
    subjectIds: string[];
  }) =>
    prisma.exam.create({
      data: {
        name: data.name,
        classId: data.classId,
      },
    }),

  findById: (id: string) =>
    prisma.exam.findUnique({ where: { id } }),

  findByClass: (classId: string) =>
    prisma.exam.findMany({
      where: { classId },
      orderBy: { createdAt: "desc" },
    }),

  upsertMarks: async (data: Array<{
    examId: string;
    studentId: string;
    subjectId: string;
    score: number;
    fullMarks: number;
    grade: string;
  }>) => {
    const results = await Promise.all(
      data.map((record) =>
        prisma.mark.upsert({
          where: {
            examId_studentId_subjectId: {
              examId: record.examId,
              studentId: record.studentId,
              subjectId: record.subjectId,
            },
          },
          update: {
            score: record.score,
            fullMarks: record.fullMarks,
            grade: record.grade,
          },
          create: {
            examId: record.examId,
            studentId: record.studentId,
            subjectId: record.subjectId,
            score: record.score,
            fullMarks: record.fullMarks,
            grade: record.grade,
          },
        })
      )
    );
    return results;
  },

  findResultsByStudent: async (examId: string, studentId: string) => {
    return prisma.mark.findMany({
      where: { examId, studentId },
      include: {
        subject: { select: { name: true } },
        student: { select: { id: true, name: true, rollNumber: true } },
      },
      orderBy: { subject: { name: "asc" } },
    });
  },

  findMarksByExamAndSubject: async (examId: string, subjectId: string) => {
    return prisma.mark.findMany({
      where: { examId, subjectId },
      include: {
        student: { select: { id: true, name: true, rollNumber: true } },
      },
      orderBy: { student: { rollNumber: "asc" } },
    });
  },
};
