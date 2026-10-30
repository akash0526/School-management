// =============================================================================
// backend/src/config/env.ts - Environment configuration (backend layer)
// Validates required env vars at startup.
// =============================================================================
import dotenv from "dotenv";
dotenv.config();

function getRequired(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  // Database (Supabase PostgreSQL)
  DATABASE_URL: getRequired("DATABASE_URL"),

  // JWT
  JWT_ACCESS_SECRET: getRequired("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: getRequired("JWT_REFRESH_SECRET"),
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "15m",
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",

  // Server
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // SMS (Sparrow SMS - Nepal)
  SPARROW_SMS_API_KEY: process.env.SPARROW_SMS_API_KEY || "mock",
  SPARROW_SMS_SENDER_ID: process.env.SPARROW_SMS_SENDER_ID || "SCHOOL",
  SMS_MOCK_MODE: process.env.SMS_MOCK_MODE !== "false",

  // Frontend URL (CORS + links)
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  // File storage
  UPLOADS_DIR: process.env.UPLOADS_DIR || "./uploads",
};
