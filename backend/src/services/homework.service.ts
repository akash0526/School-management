// =============================================================================
// backend/src/services/homework.service.ts
// Homework business logic.
// =============================================================================
import { prisma } from "@config/db";
import { homeworkRepository } from "@repositories/homework.repository";
import { AppError } from "@middleware/errorHandler";

export const homeworkService = {
  createHomework: async (data: {
    classId: string;
    subjectId: string;
    teacherId: string;
    schoolId: string;
    title: string;
    description: string;
    dueDate: string;
    attachmentUrl?: string | null;
  }) => {
    // Verify class belongs to school and teacher teaches this subject in this class
    const cls = await prisma.class.findUnique({ where: { id: data.classId } });
    if (!cls || cls.schoolId !== data.schoolId) {
      throw new AppError("Class not found", 404, "CLASS_NOT_FOUND");
    }

    const teaches = await prisma.teacherSubjectClass.findFirst({
      where: {
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        classId: data.classId,
      },
    });
    if (!teaches) {
      throw new AppError(
        "You are not assigned to teach this subject in this class",
        403,
        "NOT_ASSIGNED"
      );
    }

    return homeworkRepository.create({
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      title: data.title,
      description: data.description,
      dueDate: new Date(data.dueDate),
      attachmentUrl: data.attachmentUrl || null,
    });
  },

  getHomeworkByClass: (classId: string) =>
    homeworkRepository.findByClass(classId),
};
