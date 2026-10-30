// =============================================================================
// backend/src/routes/upload.route.ts
// =============================================================================
import { Router } from "express";
import { authenticate } from "@middleware/auth";
import { uploadController } from "@controllers/upload.controller";
import multer from "multer";

const router = Router();

// Memory storage for sharp processing (files kept in memory, not disk)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/;
    const ext = path_allowed(file.originalname);
    if (!allowed.test(ext)) {
      return cb(new Error("Only image/PDF files are allowed"));
    }
    cb(null, true);
  },
});

function path_allowed(filename: string): string {
  return path_ext(filename);
}

function path_ext(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

router.post(
  "/",
  authenticate,
  upload.single("file"),
  uploadController.uploadFile
);

export default router;
