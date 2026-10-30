// =============================================================================
// backend/src/controllers/attendance.controller.ts
// =============================================================================
import { Request, Response } from "express";
import { attendanceService } from "@services/attendance.service";

type Req = Request<Record<string, string>, {}, any, any>;

export const attendanceController = {
  markAttendance: async (req: Req, res: Response) => {
    const { user } = req as any;
    const result = await attendanceService.markAttendance({
      ...req.body,
      markedBy: user.userId,
      schoolId: user.schoolId,
      schoolName: (user as any).schoolName || "School",
    });
    return res.json({ success: true, data: result });
  },

  getClassAttendance: async (req: Req, res: Response) => {
    const { user } = req as any;
    const { classId } = req.params;
    const { date } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split("T")[0];
    const data = await attendanceService.getClassAttendance(classId, targetDate, user.schoolId);
    return res.json({ success: true, data });
  },

  getStudentAttendance: async (req: Req, res: Response) => {
    const { user } = req as any;
    const { studentId } = req.params;
    const { month } = req.query;
    const data = await attendanceService.getStudentAttendance(studentId, month as string);
    return res.json({ success: true, data });
  },
};
