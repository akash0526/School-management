// =============================================================================
// backend/src/repositories/attendance.repository.ts
// =============================================================================
import { prisma } from "@config/db";

export const attendanceRepository = {
  upsertMany: async (data: Array<{
    studentId: string;
    date: Date;
    status: string;
    markedBy: string;
  }>) => {
    // Upsert each record (unique constraint on studentId + date)
    const results = await Promise.all(
      data.map((record) =>
        prisma.attendance.upsert({
          where: {
            studentId_date: { studentId: record.studentId, date: record.date },
          },
          update: {
            status: record.status as any,
            markedBy: record.markedBy,
          },
          create: {
            studentId: record.studentId,
            date: record.date,
            status: record.status as any,
            markedBy: record.markedBy,
          },
        })
      )
    );
    return results;
  },

  findByClassAndDate: async (classId: string, date: Date) => {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);

    return prisma.attendance.findMany({
      where: {
        student: { classId },
        date: { gte: start, lte: end },
      },
      include: {
        student: {
          select: { id: true, name: true, rollNumber: true },
        },
      },
      orderBy: { student: { rollNumber: "asc" } },
    });
  },

  findByStudentAndMonth: async (studentId: string, month: string) => {
    const [year, monthNum] = month.split("-").map(Number);
    const start = new Date(Date.UTC(year, monthNum - 1, 1));
    const end = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

    return prisma.attendance.findMany({
      where: {
        studentId,
        date: { gte: start, lte: end },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        status: true,
        markedBy: true,
      },
    });
  },

  findAllStudentsWithAttendance: async (classId: string, date: Date) => {
    // Get all students in class and their attendance for the date
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);

    const students = await prisma.student.findMany({
      where: { classId },
      select: {
        id: true,
        name: true,
        rollNumber: true,
        parent: { select: { user: { select: { phone: true, name: true } } } },
      },
      orderBy: { rollNumber: "asc" },
    });

    const attendance = await prisma.attendance.findMany({
      where: {
        student: { classId },
        date: { gte: start, lte: end },
      },
      select: { studentId: true, status: true },
    });

    const attendanceMap = new Map(attendance.map((a) => [a.studentId, a.status]));

    return students.map((s) => ({
      id: s.id,
      name: s.name,
      rollNumber: s.rollNumber,
      status: attendanceMap.get(s.id) || "PRESENT",
      parentPhone: s.parent?.user?.phone || null,
      parentName: s.parent?.user?.name || null,
    }));
  },
};
