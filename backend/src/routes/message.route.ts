// =============================================================================
// backend/src/routes/message.route.ts
// =============================================================================
import { Router } from "express";
import { authenticate, authorizeRole } from "@middleware/auth";
import { messageController } from "@controllers/message.controller";
import { validate } from "@middleware/validate";
import { createMessageSchema, messageThreadQuerySchema } from "@validations/message.validation";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRole("TEACHER", "STUDENT", "PARENT"),
  validate(createMessageSchema),
  messageController.sendMessage
);

router.get(
  "/thread/:userId",
  authenticate,
  authorizeRole("TEACHER", "STUDENT", "PARENT"),
  messageController.getThread
);

router.get(
  "/contacts",
  authenticate,
  authorizeRole("TEACHER", "STUDENT", "PARENT"),
  messageController.getContacts
);

export default router;
