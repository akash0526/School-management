// =============================================================================
// backend/src/services/exam.service.ts
// Exam & marks business logic with Nepal GPA grading (Section 5).
// =============================================================================
import { prisma } from "@config/db";
import { examRepository } from "@repositories/exam.repository";
import { calculateGrade } from "@shared-types/shared";
import { AppError } from "@middleware/errorHandler";

export const examService = {
  createExam: async (data: {
    name: string;
    classId: string;
    subjectIds: string[];
    schoolId: string;
  }) => {
    const cls = await prisma.class.findUnique({ where: { id: data.classId } });
    if (!cls || cls.schoolId !== data.schoolId) {
      throw new AppError("Class not found", 404, "CLASS_NOT_FOUND");
    }

    return examRepository.create({
      name: data.name,
      classId: data.classId,
      subjectIds: data.subjectIds,
    });
  },

  getExamsByClass: (classId: string) => examRepository.findByClass(classId),

  enterMarks: async (data: {
    examId: string;
    records: Array<{
      studentId: string;
      subjectId: string;
      score: number;
      fullMarks: number;
    }>;
    schoolId: string;
  }) => {
    // Verify exam belongs to school
    const exam = await examRepository.findById(data.examId);
    if (!exam) throw new AppError("Exam not found", 404, "EXAM_NOT_FOUND");
    const cls = await prisma.class.findUnique({ where: { id: exam.classId } });
    if (!cls || cls.schoolId !== data.schoolId) {
      throw new AppError("Class not found", 404, "CLASS_NOT_FOUND");
    }

    // Auto-calculate grade for each record using Section 5 logic
    const recordsWithGrade = data.records.map((r) => {
      const grade = calculateGrade(r.score, r.fullMarks);
      return {
        examId: data.examId,
        studentId: r.studentId,
        subjectId: r.subjectId,
        score: r.score,
        fullMarks: r.fullMarks,
        grade: grade.grade,
      };
    });

    await examRepository.upsertMarks(recordsWithGrade);

    return { success: true, entered: recordsWithGrade.length };
  },

  getResults: async (examId: string, studentId: string) => {
    const exam = await examRepository.findById(examId);
    if (!exam) throw new AppError("Exam not found", 404, "EXAM_NOT_FOUND");

    const marks = await examRepository.findResultsByStudent(examId, studentId);
    if (marks.length === 0) throw new AppError("No results found", 404, "NO_RESULTS");

    const student = marks[0].student;
    const results = marks.map((m) => ({
      subject: m.subject.name,
      score: m.score,
      fullMarks: m.fullMarks,
      grade: m.grade || "NG",
      gpa: calculateGrade(m.score, m.fullMarks).gpa,
    }));

    const totalObtained = results.reduce((sum, r) => sum + r.score, 0);
    const totalFullMarks = results.reduce((sum, r) => sum + r.fullMarks, 0);
    const percentage = totalFullMarks > 0 ? (totalObtained / totalFullMarks) * 100 : 0;
    const gpa = results.length > 0
      ? results.reduce((sum, r) => sum + r.gpa, 0) / results.length
      : 0;

    return {
      exam: { name: exam.name, classId: exam.classId },
      student: { id: student.id, name: student.name, rollNumber: student.rollNumber },
      results,
      total: totalObtained,
      totalMarks: totalFullMarks,
      percentage: Math.round(percentage * 100) / 100,
      gpa: Math.round(gpa * 100) / 100,
    };
  },

  getMarksForEntry: async (examId: string, subjectId: string) => {
    return examRepository.findMarksByExamAndSubject(examId, subjectId);
  },
};
