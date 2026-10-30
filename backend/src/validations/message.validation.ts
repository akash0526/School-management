// =============================================================================
// backend/src/validations/message.validation.ts
// =============================================================================
import { z } from "zod";

export const createMessageSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
  content: z.string().min(1, "Message content is required").max(2000),
});

export const messageThreadQuerySchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});
