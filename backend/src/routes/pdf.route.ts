// =============================================================================
// backend/src/routes/pdf.route.ts
// =============================================================================
import { Router } from "express";
import { authenticate, authorizeRole } from "@middleware/auth";
import { pdfController } from "@controllers/pdf.controller";

const router = Router();

// Generate report card PDF
router.get(
  "/report-card/:examId/:studentId",
  authenticate,
  authorizeRole("ADMIN", "TEACHER", "STUDENT", "PARENT"),
  pdfController.generateReportCard
);

export default router;
