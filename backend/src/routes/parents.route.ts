// =============================================================================
// backend/src/routes/parents.route.ts - Parent-scoped routes
// Authenticated + PARENT role only
// =============================================================================
import { Router } from "express";
import { authenticate, authorizeRole } from "@middleware/auth";
import { usersController } from "@controllers/users.controller";

const router = Router();

router.use(authenticate, authorizeRole("PARENT"));

router.get("/children", usersController.getMyChildren);

export default router;
