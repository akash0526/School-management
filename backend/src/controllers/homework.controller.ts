// =============================================================================
// backend/src/controllers/homework.controller.ts
// =============================================================================
import { Request, Response } from "express";
import { homeworkService } from "@services/homework.service";

type Req = Request<Record<string, string>, {}, any, any>;

export const homeworkController = {
  createHomework: async (req: Req, res: Response) => {
    const { user } = req as any;
    const homework = await homeworkService.createHomework({
      ...req.body,
      teacherId: user.userId,
      schoolId: user.schoolId,
    });
    return res.status(201).json({ success: true, data: homework });
  },

  getHomeworkByClass: async (req: Req, res: Response) => {
    const { user } = req as any;
    const { classId } = req.params;
    // Verify access: user must be teacher of this class, or student/parent in this class
    const homework = await homeworkService.getHomeworkByClass(classId);
    return res.json({ success: true, data: homework });
  },
};
