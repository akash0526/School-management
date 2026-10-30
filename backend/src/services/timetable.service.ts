// =============================================================================
// backend/src/services/timetable.service.ts
// Timetable/routine business logic.
// =============================================================================
import { prisma } from "@config/db";
import { timetableRepository } from "@repositories/timetable.repository";
import { AppError } from "@middleware/errorHandler";

export const timetableService = {
  setTimetable: async (data: {
    classId: string;
    periods: Array<{
      day: string;
      startTime: string;
      endTime: string;
      subjectId: string;
      teacherId: string;
    }>;
    schoolId: string;
  }) => {
    // Verify class belongs to school
    const cls = await prisma.class.findUnique({ where: { id: data.classId } });
    if (!cls || cls.schoolId !== data.schoolId) {
      throw new AppError("Class not found", 404, "CLASS_NOT_FOUND");
    }

    // Delete existing periods for all days being set, then upsert new ones
    const days = [...new Set(data.periods.map((p) => p.day))];
    for (const day of days) {
      await timetableRepository.deletePeriodsForClassDay(data.classId, day);
    }

    const results = await Promise.all(
      data.periods.map((p) =>
        timetableRepository.upsertPeriod({
          classId: data.classId,
          day: p.day,
          startTime: p.startTime,
          endTime: p.endTime,
          subjectId: p.subjectId,
          teacherId: p.teacherId,
        })
      )
    );

    return { success: true, periods: results.length };
  },

  getClassTimetable: (classId: string) => timetableRepository.findByClass(classId),

  getTeacherTimetable: (teacherId: string) =>
    timetableRepository.findByTeacher(teacherId),

  getNextPeriodForClass: async (classId: string, day: string, time: string) => {
    return timetableRepository.findNextPeriodForClass(classId, day, time);
  },

  getNextPeriodForTeacher: async (teacherId: string, day: string, time: string) => {
    return timetableRepository.findNextPeriod(teacherId, day, time);
  },
};
