// =============================================================================
// backend/src/controllers/message.controller.ts
// =============================================================================
import { Request, Response } from "express";
import { messageService } from "@services/message.service";

type Req = Request<Record<string, string>, {}, any, any>;

export const messageController = {
  sendMessage: async (req: Req, res: Response) => {
    const { user } = req as any;
    const message = await messageService.sendMessage({
      senderId: user.userId,
      ...req.body,
    });
    return res.status(201).json({ success: true, data: message });
  },

  getThread: async (req: Req, res: Response) => {
    const { user } = req as any;
    const { userId } = req.params;
    await messageService.markRead(user.userId, userId);
    const thread = await messageService.getThread(user.userId, userId);
    return res.json({ success: true, data: thread });
  },

  getContacts: async (req: Req, res: Response) => {
    const { user } = req as any;
    const contacts = await messageService.getContacts(user.userId);
    return res.json({ success: true, data: contacts });
  },
};
