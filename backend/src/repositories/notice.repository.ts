// =============================================================================
// backend/src/repositories/notice.repository.ts
// =============================================================================
import { prisma } from "@config/db";

export const noticeRepository = {
  create: async (data: {
    schoolId: string;
    title: string;
    content: string;
    targetRole?: string;
    targetClassId?: string;
    sendSms: boolean;
  }) =>
    prisma.notice.create({
      data: {
        schoolId: data.schoolId,
        title: data.title,
        content: data.content,
        targetRole: (data.targetRole || null) as any,
        targetClassId: data.targetClassId || null,
        sendSms: data.sendSms,
      },
      include: { school: { select: { name: true, phone: true } } },
    }),

  findRelevant: async (params: {
    schoolId: string;
    role?: string;
    classId?: string;
  }) => {
    const where: any = {
      schoolId: params.schoolId,
    };

    // If role and classId provided, filter notices relevant to that user
    if (params.role || params.classId) {
      where.OR = [
        { targetRole: null }, // everyone
        { targetClassId: null, targetRole: params.role || null },
        { targetClassId: params.classId || null },
      ];
    }

    return prisma.notice.findMany({
      where,
      include: { school: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },

  findAll: async (schoolId: string) =>
    prisma.notice.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
    }),

  getRecipients: async (schoolId: string, notice: {
    targetRole?: string | null;
    targetClassId?: string | null;
  }) => {
    const where: any = {};

    if (notice.targetClassId) {
      // Send to parents of students in that class
      const students = await prisma.student.findMany({
        where: { classId: notice.targetClassId },
        include: { parent: { select: { user: { select: { phone: true, name: true } } } } },
      });
      return students
        .filter((s) => s.parent?.user?.phone)
        .map((s) => ({
          phone: s.parent!.user!.phone!,
          name: s.parent!.user!.name!,
          studentName: s.name,
        }));
    }

    if (notice.targetRole) {
      // Send to users with that role in the school
      const users = await prisma.user.findMany({
        where: { schoolId, role: notice.targetRole as any, isActive: true },
        select: { phone: true, name: true },
      });
      return users.map((u) => ({ phone: u.phone, name: u.name }));
    }

    // Everyone in the school
    const users = await prisma.user.findMany({
      where: { schoolId, isActive: true },
      select: { phone: true, name: true },
    });
    return users.map((u) => ({ phone: u.phone, name: u.name }));
  },
};
