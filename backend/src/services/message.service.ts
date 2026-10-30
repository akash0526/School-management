// =============================================================================
// backend/src/services/message.service.ts
// Messaging business logic.
// =============================================================================
import { messageRepository } from "@repositories/message.repository";

export const messageService = {
  sendMessage: (data: { senderId: string; receiverId: string; content: string }) =>
    messageRepository.create(data),

  getThread: (userId1: string, userId2: string) =>
    messageRepository.findThread(userId1, userId2),

  markRead: (receiverId: string, senderId: string) =>
    messageRepository.markRead(receiverId, senderId),

  getContacts: (userId: string) => messageRepository.findContacts(userId),
};
