// =============================================================================
// backend/src/services/attendance.service.ts
// Attendance business logic with absence SMS alerts to parents.
// =============================================================================
import { prisma } from "@config/db";
import { attendanceRepository } from "@repositories/attendance.repository";
import { sendAbsenceAlert } from "./notification.service";
import { AppError } from "@middleware/errorHandler";

export const attendanceService = {
  markAttendance: async (data: {
    classId: string;
    date: string; // YYYY-MM-DD
    records: Array<{ studentId: string; status: string }>;
    markedBy: string; // teacherId
    schoolId: string;
    schoolName: string;
  }) => {
    // Verify class belongs to school
    const cls = await prisma.class.findUnique({ where: { id: data.classId } });
    if (!cls || cls.schoolId !== data.schoolId) {
      throw new AppError("Class not found", 404, "CLASS_NOT_FOUND");
    }

    const markDate = new Date(data.date);
    markDate.setUTCHours(12, 0, 0, 0); // noon UTC to avoid timezone issues

    // Bulk upsert attendance
    await attendanceRepository.upsertMany(
      data.records.map((r) => ({
        studentId: r.studentId,
        date: markDate,
        status: r.status,
        markedBy: data.markedBy,
      }))
    );

    // Send absence SMS to parents of absent students
    const absentRecords = data.records.filter((r) => r.status === "ABSENT");
    for (const record of absentRecords) {
      const student = await prisma.student.findUnique({
        where: { id: record.studentId },
        include: { parent: { select: { user: { select: { phone: true, name: true } } } } },
      });
      if (student?.parent?.user?.phone) {
        await sendAbsenceAlert({
          studentName: student.name,
          date: data.date,
          schoolName: data.schoolName,
          parentPhone: student.parent.user.phone,
          locale: "ne",
        });
      }
    }

    return { success: true, marked: data.records.length, absent: absentRecords.length };
  },

  getClassAttendance: async (classId: string, date: string, schoolId: string) => {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls || cls.schoolId !== schoolId) {
      throw new AppError("Class not found", 404, "CLASS_NOT_FOUND");
    }
    const markDate = new Date(date);
    markDate.setUTCHours(12, 0, 0, 0);
    return attendanceRepository.findAllStudentsWithAttendance(classId, markDate);
  },

  getStudentAttendance: async (studentId: string, month?: string) => {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new AppError("Student not found", 404, "STUDENT_NOT_FOUND");

    if (month) {
      return attendanceRepository.findByStudentAndMonth(studentId, month);
    }

    // Default: today's attendance
    const today = new Date().toISOString().split("T")[0];
    return attendanceRepository.findByClassAndDate(student.classId, new Date(today));
  },
};
