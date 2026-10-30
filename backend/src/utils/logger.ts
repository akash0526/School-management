// =============================================================================
// backend/src/utils/logger.ts - File-based logging for SMS, notifications, errors
// =============================================================================
import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function formatLog(level: string, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level}] ${message}${metaStr}\n`;
}

export function logSms(phone: string, body: string, success: boolean, messageId?: string, error?: string): void {
  ensureLogDir();
  fs.appendFileSync(
    path.join(LOG_DIR, "sms.log"),
    formatLog("SMS", `to=${phone} success=${success} messageId=${messageId || "-"} error=${error || "-"}`, { body })
  );
}

export function logNotification(type: string, recipient: string, success: boolean, error?: string): void {
  ensureLogDir();
  fs.appendFileSync(
    path.join(LOG_DIR, "notifications.log"),
    formatLog("NOTIFICATION", `type=${type} recipient=${recipient} success=${success} error=${error || "-"}`)
  );
}

export function logError(message: string, meta?: unknown): void {
  ensureLogDir();
  fs.appendFileSync(path.join(LOG_DIR, "error.log"), formatLog("ERROR", message, meta));
}

export function logInfo(message: string, meta?: unknown): void {
  ensureLogDir();
  fs.appendFileSync(path.join(LOG_DIR, "app.log"), formatLog("INFO", message, meta));
}
