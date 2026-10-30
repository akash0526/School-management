// =============================================================================
// backend/src/controllers/notice.controller.ts
// =============================================================================
import { Request, Response } from "express";
import { noticeService } from "@services/notice.service";

type Req = Request<Record<string, string>, {}, any, any>;

export const noticeController = {
  createNotice: async (req: Req, res: Response) => {
    const { user } = req as any;
    const notice = await noticeService.createNotice({
      ...req.body,
      schoolId: user.schoolId,
    });
    return res.status(201).json({ success: true, data: notice });
  },

  getNotices: async (req: Req, res: Response) => {
    const { user } = req as any;
    const { role, classId } = req.query;
    const notices = await noticeService.getNotices({
      schoolId: user.schoolId,
      role: role as string,
      classId: classId as string,
    });
    return res.json({ success: true, data: notices });
  },

  getAllNotices: async (req: Req, res: Response) => {
    const { user } = req as any;
    const notices = await noticeService.getAllNotices(user.schoolId);
    return res.json({ success: true, data: notices });
  },
};
