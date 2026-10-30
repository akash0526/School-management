// =============================================================================
// @sms/api/src/config/env.ts - Environment configuration
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
  // Database
  DATABASE_URL: getRequired("DATABASE_URL"),

  // JWT
  JWT_ACCESS_SECRET: getRequired("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: getRequired("JWT_REFRESH_SECRET"),
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "15m",
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",

  // Server
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // SMS (Sparrow SMS)
  SPARROW_SMS_API_KEY: process.env.SPARROW_SMS_API_KEY || "mock",
  SPARROW_SMS_SENDER_ID: process.env.SPARROW_SMS_SENDER_ID || "SCHOOL",
  SMS_MOCK_MODE: process.env.SMS_MOCK_MODE !== "false", // default true

  // FCM
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,

  // Uploads
  UPLOADS_DIR: process.env.UPLOADS_DIR || "./uploads",

  // Frontend URL (for redirects/links)
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};
