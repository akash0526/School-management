// =============================================================================
// backend/src/server.ts - Express application entry point (backend layer)
// =============================================================================
import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { env } from "@config/env";
import { errorHandler } from "@middleware/errorHandler";
import { generalApiLimiter } from "@middleware/rateLimiter";
import authRoute from "@routes/auth.route";
import usersRoute from "@routes/users.route";
import attendanceRoute from "@routes/attendance.route";
import noticeRoute from "@routes/notice.route";
import homeworkRoute from "@routes/homework.route";
import messageRoute from "@routes/message.route";
import uploadRoute from "@routes/upload.route";
import examRoute from "@routes/exam.route";
import pdfRoute from "@routes/pdf.route";
import timetableRoute from "@routes/timetable.route";
import parentsRoute from "@routes/parents.route";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(generalApiLimiter);

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", service: "sms-backend", time: new Date().toISOString() } });
});

// Serve uploaded files statically
app.use("/uploads", express.static(path.resolve(env.UPLOADS_DIR)));

app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/attendance", attendanceRoute);
app.use("/api/notices", noticeRoute);
app.use("/api/homework", homeworkRoute);
app.use("/api/messages", messageRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/exams", examRoute);
app.use("/api/pdf", pdfRoute);
app.use("/api/timetable", timetableRoute);
app.use("/api/parents", parentsRoute);

// Placeholder routes for upcoming phases
const upcoming: string[] = [];
for (const routePath of upcoming) {
  app.use(routePath, (_req, res) => {
    res.status(501).json({ success: false, error: { message: "Not implemented yet", code: "NOT_IMPLEMENTED" } });
  });
}

app.use((_req, res) => {
  res.status(404).json({ success: false, error: { message: "Route not found", code: "NOT_FOUND" } });
});

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`[SMS Backend] listening on port ${env.PORT} (${env.NODE_ENV})`);
});

export default server;
