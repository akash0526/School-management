// =============================================================================
// backend/src/services/pdf.service.ts
// PDF generation for report cards using Puppeteer.
// Renders Nepali text correctly using Noto Sans Devanagari font.
// =============================================================================
import fs from "fs";
import path from "path";

export interface ReportCardData {
  school: { name: string; address?: string; phone?: string; logoUrl?: string };
  student: { id: string; name: string; rollNumber: string; className?: string };
  exam: { name: string };
  results: Array<{
    subject: string;
    score: number;
    fullMarks: number;
    grade: string;
    gpa: number;
  }>;
  total: number;
  totalMarks: number;
  percentage: number;
  gpa: number;
}

/**
 * Generate report card PDF HTML template.
 * Returns an HTML string that can be rendered by Puppeteer.
 */
export function generateReportCardHtml(data: ReportCardData): string {
  const rows = data.results
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(r.subject)}</td>
        <td style="text-align:center">${r.fullMarks}</td>
        <td style="text-align:center">${r.score}</td>
        <td style="text-align:center">${r.grade}</td>
      </tr>
    `
    )
    .join("");

  const logoHtml = data.school.logoUrl
    ? `<img src="${data.school.logoUrl}" alt="Logo" class="logo" />`
    : `<div class="logo-placeholder">S</div>`;

  return `
    <!DOCTYPE html>
    <html lang="ne">
    <head>
      <meta charset="utf-8" />
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap');
        body {
          font-family: 'Noto Sans Devanagari', 'Noto Sans', sans-serif;
          font-size: 12px;
          color: #111;
          line-height: 1.4;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #1a202c;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .school-info h1 {
          font-size: 22px;
          margin: 0;
          color: #1a202c;
        }
        .school-info p {
          margin: 2px 0;
          color: #4a5568;
          font-size: 11px;
        }
        .logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }
        .logo-placeholder {
          width: 60px;
          height: 60px;
          border: 2px dashed #1a202c;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 24px;
          color: #1a202c;
        }
        .student-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .student-box {
          border: 1px solid #cbd5e0;
          padding: 12px;
          border-radius: 6px;
          flex: 1;
        }
        .student-box h2 {
          margin: 0 0 4px 0;
          font-size: 16px;
        }
        .results-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .results-table th {
          background: #edf2f7;
          border: 1px solid #cbd5e0;
          padding: 8px;
          text-align: left;
          font-size: 12px;
        }
        .results-table td {
          border: 1px solid #cbd5e0;
          padding: 8px;
          font-size: 12px;
        }
        .results-table td.center {
          text-align: center;
        }
        .summary {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          border-top: 1px solid #cbd5e0;
          padding-top: 15px;
        }
        .summary-item {
          text-align: center;
          flex: 1;
        }
        .summary-item .label {
          font-size: 10px;
          color: #718096;
        }
        .summary-item .value {
          font-size: 16px;
          font-weight: bold;
          color: #1a202c;
        }
        .footer {
          margin-top: 30px;
          font-size: 10px;
          color: #718096;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-info">
          ${logoHtml}
          <h1>${escapeHtml(data.school.name)}</h1>
          <p>${escapeHtml(data.school.address || "")}</p>
          <p>Phone: ${escapeHtml(data.school.phone || "")}</p>
        </div>
      </div>

      <div class="student-info">
        <div class="student-box">
          <h2>Report Card</h2>
          <p><strong>Student:</strong> ${escapeHtml(data.student.name)}</p>
          <p><strong>Roll Number:</strong> ${data.student.rollNumber}</p>
          <p><strong>Class:</strong> ${escapeHtml(data.student.className || "")}</p>
        </div>
        <div class="student-box">
          <p><strong>Exam:</strong> ${escapeHtml(data.exam.name)}</p>
          <p><strong>Term:</strong> Final</p>
        </div>
      </div>

      <table class="results-table">
        <thead>
          <tr>
            <th style="width:50%">Subject</th>
            <th class="center" style="width:15%">Full Marks</th>
            <th class="center" style="width:15%">Obtained</th>
            <th class="center" style="width:20%">Grade</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-item">
          <div class="label">Total</div>
          <div class="value">${data.total} / ${data.totalMarks}</div>
        </div>
        <div class="summary-item">
          <div class="label">Percentage</div>
          <div class="value">${data.percentage}%</div>
        </div>
        <div class="summary-item">
          <div class="label">GPA</div>
          <div class="value">${data.gpa}</div>
        </div>
      </div>

      <div class="footer">
        Generated by School Management System &bull; ${new Date().toLocaleDateString("ne-NP")}
      </div>
    </body>
    </html>
  `;
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
