// =============================================================================
// @sms/api/src/config/db.ts - Prisma client connection
// Uses the shared prisma client from @sms/database (single source of truth).
// =============================================================================
import { prisma } from "@sms/database";

export { prisma };
export default prisma;
