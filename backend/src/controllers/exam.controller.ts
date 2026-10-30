// =============================================================================
// backend/src/controllers/exam.controller.ts
// =============================================================================
import { Request, Response } from "express";
import { examService } from "@services/exam.service";

type Req = Request<Record<string, string>, {}, any, any>;

export const examController = {
  createExam: async (req: Req, res: Response) => {
    const { user } = req as any;
    const exam = await examService.createExam({
      ...req.body,
      schoolId: user.schoolId,
    });
    return res.status(201).json({ success: true, data: exam });
  },

  getExamsByClass: async (req: Req, res: Response) => {
    const { user } = req as any;
    const { classId } = req.params;
    const exams = await examService.getExamsByClass(classId);
    return res.json({ success: true, data: exams });
  },

  enterMarks: async (req: Req, res: Response) => {
    const { user } = req as any;
    const { examId } = req.params;
    const result = await examService.enterMarks({
      examId,
      ...req.body,
      schoolId: user.schoolId,
    });
    return res.json({ success: true, data: result });
  },

  getResults: async (req: Req, res: Response) => {
    const { user } = req as any;
    const { examId, studentId } = req.params;
    const result = await examService.getResults(examId, studentId);
    return res.json({ success: true, data: result });
  },

  getMarksForEntry: async (req: Req, res: Response) => {
    const { user } = req as any;
    const { examId, subjectId } = req.params;
    const marks = await examService.getMarksForEntry(examId, subjectId);
    return res.json({ success: true, data: marks });
  },
};
