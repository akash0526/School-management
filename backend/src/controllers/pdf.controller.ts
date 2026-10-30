// =============================================================================
// backend/src/controllers/pdf.controller.ts
// Report card PDF generation controller using Puppeteer.
// =============================================================================
import { Request, Response } from "express";
import { examService } from "@services/exam.service";
import { generateReportCardHtml } from "@services/pdf.service";

type Req = Request<Record<string, string>, {}, any, any>;

export const pdfController = {
  generateReportCard: async (req: Req, res: Response) => {
    const { user } = req as any;
    const { examId, studentId } = req.params;

    try {
      // Fetch result data
      const result = await examService.getResults(examId, studentId);

      // Get student's class name
      const cls = await (globalThis as any).prisma?.class?.findUnique?.({
        where: { id: result.exam.classId },
        select: { name: true, section: true },
      });

      // Get school info
      const school = await (globalThis as any).prisma?.school?.findUnique?.({
        where: { id: user.schoolId },
        select: { name: true, address: true, phone: true, logoUrl: true },
      });

      const reportData = {
        school: {
          name: school?.name || "School",
          address: school?.address || "",
          phone: school?.phone || "",
          logoUrl: school?.logoUrl || undefined,
        },
        student: {
          id: result.student.id,
          name: result.student.name,
          rollNumber: result.student.rollNumber,
          className: cls ? `${cls.name} ${cls.section}` : "",
        },
        exam: { name: result.exam.name },
        results: result.results,
        total: result.total,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        gpa: result.gpa,
      };

      const html = generateReportCardHtml(reportData);

      let pdfBuffer: Buffer;
      try {
        const puppeteer = require("puppeteer");
        const browser = await puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: 15, right: 15, bottom: 15, left: 15 },
        });
        await browser.close();
      } catch (puppeteerErr) {
        // Fallback: return HTML as buffer if Puppeteer unavailable
        pdfBuffer = Buffer.from(html, "utf-8");
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=report-card-${studentId}.pdf`);
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { message: err?.message || "Failed to generate report card", code: "PDF_GENERATION_FAILED" },
      });
    }
  },
};
