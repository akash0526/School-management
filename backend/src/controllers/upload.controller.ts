// =============================================================================
// backend/src/controllers/upload.controller.ts
// =============================================================================
import { Request, Response } from "express";
import { uploadService } from "@services/upload.service";

export const uploadController = {
  uploadFile: async (req: Request, res: Response) => {
    const file = req.file as {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
    } | undefined;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: { message: "No file uploaded", code: "NO_FILE" },
      });
    }
    const result = await uploadService.saveFile(file);
    return res.json({ success: true, data: result });
  },
};
