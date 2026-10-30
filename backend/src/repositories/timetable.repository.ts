// =============================================================================
// backend/src/repositories/timetable.repository.ts
// =============================================================================
import { prisma } from "@config/db";

export const timetableRepository = {
  upsertPeriod: async (data: {
    classId: string;
    day: string;
    startTime: string;
    endTime: string;
    subjectId: string;
    teacherId: string;
  }) =>
    prisma.timetable.upsert({
      where: {
        classId_day_startTime: {
          classId: data.classId,
          day: data.day,
          startTime: data.startTime,
        },
      },
      update: {
        endTime: data.endTime,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
      },
      create: {
        classId: data.classId,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
      },
    }),

  deletePeriodsForClassDay: async (classId: string, day: string) =>
    prisma.timetable.deleteMany({ where: { classId, day } }),

  findByClass: (classId: string) =>
    prisma.timetable.findMany({
      where: { classId },
      include: {
        subject: { select: { name: true } },
        teacher: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    }),

  findByTeacher: (teacherId: string) =>
    prisma.timetable.findMany({
      where: { teacherId },
      include: {
        subject: { select: { name: true } },
        class: { select: { id: true, name: true, section: true } },
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    }),

  findNextPeriod: async (teacherId: string, day: string, time: string) => {
    return prisma.timetable.findFirst({
      where: {
        teacherId,
        day,
        startTime: { gt: time },
      },
      include: {
        subject: { select: { name: true } },
        class: { select: { id: true, name: true, section: true } },
      },
      orderBy: { startTime: "asc" },
    });
  },

  findNextPeriodForClass: async (classId: string, day: string, time: string) => {
    return prisma.timetable.findFirst({
      where: {
        classId,
        day,
        startTime: { gt: time },
      },
      include: {
        subject: { select: { name: true } },
        teacher: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { startTime: "asc" },
    });
  },
};
