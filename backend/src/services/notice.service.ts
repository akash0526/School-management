// =============================================================================
// backend/src/services/notice.service.ts
// Notice business logic with async SMS dispatch.
// =============================================================================
import { prisma } from "@config/db";
import { noticeRepository } from "@repositories/notice.repository";
import { batchSendNoticeSms } from "./notification.service";
import { AppError } from "@middleware/errorHandler";

export const noticeService = {
  createNotice: async (data: {
    schoolId: string;
    title: string;
    content: string;
    targetRole?: string;
    targetClassId?: string;
    sendSms: boolean;
  }) => {
    const notice = await noticeRepository.create(data);

    // If sendSms, queue SMS to matched recipients (async, non-blocking)
    if (data.sendSms) {
      const school = await prisma.school.findUnique({
        where: { id: data.schoolId },
        select: { name: true },
      });
      const recipients = await noticeRepository.getRecipients(data.schoolId, {
        targetRole: data.targetRole || undefined,
        targetClassId: data.targetClassId || undefined,
      });

      batchSendNoticeSms(
        recipients.map((r) => ({
          phone: r.phone,
          noticeTitle: data.title,
          schoolName: school?.name || "School",
          locale: "ne" as const,
        }))
      );
    }

    return notice;
  },

  getNotices: async (params: {
    schoolId: string;
    role?: string;
    classId?: string;
  }) => noticeRepository.findRelevant(params),

  getAllNotices: async (schoolId: string) => noticeRepository.findAll(schoolId),
};
