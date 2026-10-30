// =============================================================================
// @sms/api/src/server.ts - Express application entry point
// =============================================================================
import "express-async-errors"; // patch Express to forward async route rejections to error handler
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "@config/env";
import { errorHandler } from "@middleware/errorHandler";
import { generalApiLimiter } from "@middleware/rateLimiter";
import authRoute from "@modules/auth/auth.route";
import usersRoute from "@modules/users/users.route";

const app = express();

// Trust proxy (important for rate limiting by IP behind a reverse proxy)
app.set("trust proxy", 1);

// Security & CORS
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// General rate limiter
app.use(generalApiLimiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", service: "sms-api", time: new Date().toISOString() } });
});

// API routes
app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);

// Placeholder routes for upcoming phases (return 501 not implemented until built)
const upcoming = [
  "/api/attendance",
  "/api/homework",
  "/api/notices",
  "/api/exams",
  "/api/messages",
  "/api/upload",
  "/api/timetable",
];
for (const path of upcoming) {
  app.use(path, (_req, res) => {
    res.status(501).json({ success: false, error: { message: "Not implemented yet", code: "NOT_IMPLEMENTED" } });
  });
}

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { message: "Route not found", code: "NOT_FOUND" } });
});

// Global error handler (must be last)
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`[SMS API] listening on port ${env.PORT} (${env.NODE_ENV})`);
});

export default server;
