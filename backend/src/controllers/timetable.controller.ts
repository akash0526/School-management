// =============================================================================
// backend/src/controllers/timetable.controller.ts
// =============================================================================
import { Request, Response } from "express";
import { timetableService } from "@services/timetable.service";

type Req = Request<Record<string, string>, {}, any, any>;

export const timetableController = {
  setTimetable: async (req: Req, res: Response) => {
    const { user } = req as any;
    const result = await timetableService.setTimetable({
      ...req.body,
      schoolId: user.schoolId,
    });
    return res.json({ success: true, data: result });
  },

  getClassTimetable: async (req: Req, res: Response) => {
    const { user } = req as any;
    const { classId } = req.params;
    const timetable = await timetableService.getClassTimetable(classId);
    return res.json({ success: true, data: timetable });
  },

  getTeacherTimetable: async (req: Req, res: Response) => {
    const { user } = req as any;
    const { teacherId } = req.params;
    const timetable = await timetableService.getTeacherTimetable(teacherId);
    return res.json({ success: true, data: timetable });
  },

  getNextPeriodForClass: async (req: Req, res: Response) => {
    const { classId } = req.params;
    const { day, time } = req.query;
    const next = await timetableService.getNextPeriodForClass(
      classId,
      day as string,
      time as string
    );
    return res.json({ success: true, data: next });
  },

  getNextPeriodForTeacher: async (req: Req, res: Response) => {
    const { teacherId } = req.params;
    const { day, time } = req.query;
    const next = await timetableService.getNextPeriodForTeacher(
      teacherId,
      day as string,
      time as string
    );
    return res.json({ success: true, data: next });
  },
};
