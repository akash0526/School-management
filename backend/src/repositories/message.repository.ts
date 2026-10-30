// =============================================================================
// backend/src/repositories/message.repository.ts
// =============================================================================
import { prisma } from "@config/db";

export const messageRepository = {
  create: async (data: {
    senderId: string;
    receiverId: string;
    content: string;
  }) =>
    prisma.message.create({
      data: {
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
      },
    }),

  findThread: async (userId1: string, userId2: string) =>
    prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),

  markRead: async (receiverId: string, senderId: string) =>
    prisma.message.updateMany({
      where: { senderId, receiverId, readAt: null },
      data: { readAt: new Date() },
    }),

  findContacts: async (userId: string) => {
    // Get distinct users who have messaged with this user
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: { senderId: true, receiverId: true },
      distinct: ["senderId", "receiverId"],
    });

    const contactIds = new Set<string>();
    for (const m of messages) {
      if (m.senderId !== userId) contactIds.add(m.senderId);
      if (m.receiverId !== userId) contactIds.add(m.receiverId);
    }

    if (contactIds.size === 0) return [];

    return prisma.user.findMany({
      where: { id: { in: Array.from(contactIds) } },
      select: { id: true, phone: true, name: true, role: true },
      orderBy: { name: "asc" },
    });
  },
};
