// =============================================================================
// backend/src/services/notification.service.ts
// SMS notification templates (Section 8) + async queue for bulk SMS.
// =============================================================================
import { sendSms } from "./sms.service";
import { logNotification, logInfo } from "@utils/logger";
import { prisma } from "@config/db";

type Locale = "en" | "ne";

// Default SMS templates (Section 8). Can be overridden by MessageTemplate table.
const DEFAULT_TEMPLATES: Record<string, Record<Locale, (params: Record<string, string>) => string>> = {
  ABSENCE_ALERT: {
    en: (p) => `${p.studentName} was marked absent today (${p.date}) at ${p.schoolName}.`,
    ne: (p) => `${p.studentName} आज (${p.date}) विद्यालयमा अनुपस्थित रहनुभयो - ${p.schoolName}।`,
  },
  NOTICE_ALERT: {
    en: (p) => `New notice from ${p.schoolName}: ${p.noticeTitle}`,
    ne: (p) => `${p.schoolName} बाट नयाँ सूचना: ${p.noticeTitle}`,
  },
  RESULT_PUBLISHED: {
    en: (p) => `${p.studentName}'s result for ${p.examName} has been published. Check the app for details.`,
    ne: (p) => `${p.studentName} को ${p.examName} को नतिजा प्रकाशित भएको छ। विवरणका लागि एप हेर्नुहोस्।`,
  },
};

function renderTemplate(key: string, locale: Locale, params: Record<string, string>): string {
  const t = DEFAULT_TEMPLATES[key]?.[locale];
  if (!t) return JSON.stringify(params);
  return t(params);
}

/** Send absence alert SMS to parent (used when a student is marked ABSENT). */
export async function sendAbsenceAlert(params: {
  studentName: string;
  date: string;
  schoolName: string;
  parentPhone: string;
  locale: Locale;
}): Promise<void> {
  const body = renderTemplate("ABSENCE_ALERT", params.locale, {
    studentName: params.studentName,
    date: params.date,
    schoolName: params.schoolName,
  });
  try {
    const result = await sendSms(params.parentPhone, body);
    logNotification("ABSENCE_ALERT", params.parentPhone, result.success, result.error);
    if (result.success) {
      logInfo("Absence alert SMS sent", { to: params.parentPhone, student: params.studentName });
    }
  } catch (err) {
    logNotification("ABSENCE_ALERT", params.parentPhone, false, err instanceof Error ? err.message : String(err));
    logErrorSafe("Failed to send absence alert", { to: params.parentPhone, student: params.studentName, error: err });
  }
}

/** Send notice alert SMS to a single recipient. */
export async function sendNoticeAlert(params: {
  noticeTitle: string;
  schoolName: string;
  recipientPhone: string;
  locale: Locale;
}): Promise<void> {
  const body = renderTemplate("NOTICE_ALERT", params.locale, {
    noticeTitle: params.noticeTitle,
    schoolName: params.schoolName,
  });
  try {
    const result = await sendSms(params.recipientPhone, body);
    logNotification("NOTICE_ALERT", params.recipientPhone, result.success, result.error);
  } catch (err) {
    logNotification("NOTICE_ALERT", params.recipientPhone, false, err instanceof Error ? err.message : String(err));
  }
}

/** Async SMS queue — processes messages in background without blocking API response. */
const smsQueue: Array<{ to: string; body: string }> = [];
let processing = false;

function enqueueSms(to: string, body: string): void {
  smsQueue.push({ to, body });
  if (!processing) {
    processing = true;
    setImmediate(processQueue);
  }
}

async function processQueue(): Promise<void> {
  while (smsQueue.length > 0) {
    const item = smsQueue.shift();
    if (!item) break;
    try {
      await sendSms(item.to, item.body);
    } catch (err) {
      logErrorSafe("Queued SMS failed", { to: item.to, error: err });
    }
  }
  processing = false;
}

/**
 * Batch send notice SMS asynchronously. Returns immediately; SMS sent in background.
 * Use for notice SMS to many recipients.
 */
export async function batchSendNoticeSms(
  recipients: Array<{ phone: string; noticeTitle: string; schoolName: string; locale: Locale }>
): Promise<void> {
  for (const r of recipients) {
    enqueueSms(r.phone, renderTemplate("NOTICE_ALERT", r.locale, {
      noticeTitle: r.noticeTitle,
      schoolName: r.schoolName,
    }));
  }
  logInfo("Notice SMS queued", { count: recipients.length, school: recipients[0]?.schoolName });
}

function logErrorSafe(message: string, meta?: unknown): void {
  // Avoid importing logger twice; use dynamic require
  const { logError } = require("@utils/logger");
  logError(message, meta);
}

export { enqueueSms, processQueue };

export default {
  sendAbsenceAlert,
  sendNoticeAlert,
  batchSendNoticeSms,
  enqueueSms,
};
