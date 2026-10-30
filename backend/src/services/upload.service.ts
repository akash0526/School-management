// =============================================================================
// backend/src/services/upload.service.ts
// File upload with sharp image compression (max 1200px, WebP).
// Saves to local /uploads folder, structured to migrate to S3 later.
// =============================================================================
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { env } from "@config/env";

const UPLOADS_DIR = env.UPLOADS_DIR;

function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export const uploadService = {
  saveFile: async (file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  }): Promise<{ url: string; filename: string }> => {
    ensureUploadsDir();
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // If image, compress to WebP max 1200px
    if (file.mimetype.startsWith("image/")) {
      const webpFilename = `${uuidv4()}.webp`;
      const webpFilepath = path.join(UPLOADS_DIR, webpFilename);
      await sharp(file.buffer)
        .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(webpFilepath);
      return { url: `/uploads/${webpFilename}`, filename: webpFilename };
    }

    // PDF or other: save as-is
    fs.writeFileSync(filepath, file.buffer);
    return { url: `/uploads/${filename}`, filename };
  },
};

export default uploadService;
