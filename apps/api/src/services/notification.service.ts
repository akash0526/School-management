// =============================================================================
// @sms/api/src/services/notification.service.ts - Notification service
// Handles SMS notifications for absence, notices, results.
// Async / queue-friendly so API responses are not blocked.
// =============================================================================
import { sendSms } from "./sms.service";
import { logNotification, logInfo, logError } from "@utils/logger";

export interface AbsenceAlertParams {
  studentName: string;
  date: string;
  schoolName: string;
  parentPhone: string;
  locale: "en" | "ne";
}

export interface NoticeAlertParams {
  noticeTitle: string;
  schoolName: string;
  recipientPhone: string;
  locale: "en" | "ne";
}

export interface ResultPublishedParams {
  studentName: string;
  examName: string;
  recipientPhone: string;
  locale: "en" | "ne";
}

const ABSENCE_ALERT = {
  en: (p: AbsenceAlertParams) =>
    `${p.studentName} was marked absent today (${p.date}) at ${p.schoolName}.`,
  ne: (p: AbsenceAlertParams) =>
    `${p.studentName} आज (${p.date}) विद्यालयमा अनुपस्थित रहनुभयो - ${p.schoolName}।`,
};

const NOTICE_ALERT = {
  en: (p: NoticeAlertParams) => `New notice from ${p.schoolName}: ${p.noticeTitle}`,
  ne: (p: NoticeAlertParams) => `${p.schoolName} बाट नयाँ सूचना: ${p.noticeTitle}`,
};

const RESULT_PUBLISHED = {
  en: (p: ResultPublishedParams) =>
    `${p.studentName}'s result for ${p.examName} has been published. Check the app for details.`,
  ne: (p: ResultPublishedParams) =>
    `${p.studentName} को ${p.examName} को नतिजा प्रकाशित भएको छ। विवरणका लागि एप हेर्नुहोस्।`,
};

/** Send absence alert SMS to parent (used when a student is marked ABSENT). */
export async function sendAbsenceAlert(params: AbsenceAlertParams): Promise<void> {
  const body = (params.locale === "ne" ? ABSENCE_ALERT.ne : ABSENCE_ALERT.en)(params);
  try {
    const result = await sendSms(params.parentPhone, body);
    logNotification("ABSENCE_ALERT", params.parentPhone, result.success, result.error);
    if (result.success) {
      logInfo("Absence alert SMS sent", { to: params.parentPhone, student: params.studentName });
    }
  } catch (err) {
    logNotification("ABSENCE_ALERT", params.parentPhone, false, err instanceof Error ? err.message : String(err));
    logError("Failed to send absence alert", { to: params.parentPhone, student: params.studentName, error: err });
  }
}

/** Send notice alert SMS. */
export async function sendNoticeAlert(params: NoticeAlertParams): Promise<void> {
  const body = (params.locale === "ne" ? NOTICE_ALERT.ne : NOTICE_ALERT.en)(params);
  try {
    const result = await sendSms(params.recipientPhone, body);
    logNotification("NOTICE_ALERT", params.recipientPhone, result.success, result.error);
  } catch (err) {
    logNotification("NOTICE_ALERT", params.recipientPhone, false, err instanceof Error ? err.message : String(err));
  }
}

/** Send result published SMS. */
export async function sendResultPublished(params: ResultPublishedParams): Promise<void> {
  const body = (params.locale === "ne" ? RESULT_PUBLISHED.ne : RESULT_PUBLISHED.en)(params);
  try {
    const result = await sendSms(params.recipientPhone, body);
    logNotification("RESULT_PUBLISHED", params.recipientPhone, result.success, result.error);
  } catch (err) {
    logNotification("RESULT_PUBLISHED", params.recipientPhone, false, err instanceof Error ? err.message : String(err));
  }
}

/**
 * Batch send SMS without blocking. Returns immediately; each SMS is sent async.
 * Use for notice SMS to many recipients.
 */
export async function batchSendSms(
  recipients: Array<{ phone: string; body: string; locale?: "en" | "ne" }>
): Promise<void> {
  for (const r of recipients) {
    // fire-and-forget style but still awaited sequentially to avoid overwhelming gateway
    try {
      const result = await sendSms(r.phone, r.body);
      logNotification("BATCH_SMS", r.phone, result.success, result.error);
    } catch (err) {
      logNotification("BATCH_SMS", r.phone, false, err instanceof Error ? err.message : String(err));
    }
  }
}

export default {
  sendAbsenceAlert,
  sendNoticeAlert,
  sendResultPublished,
  batchSendSms,
};
