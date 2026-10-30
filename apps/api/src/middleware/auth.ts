// =============================================================================
// @sms/api/src/middleware/auth.ts - JWT authentication + role guard
// =============================================================================
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "@config/env";
import { prisma } from "@config/db";
import { Role } from "@shared-types";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    phone: string;
    role: Role;
    schoolId: string;
  };
}

const ACCESS_SECRET = env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = env.JWT_REFRESH_SECRET;

/** Extract bearer token from Authorization header. */
function getTokenFromHeader(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

/**
 * authenticate middleware - verifies JWT access token and attaches user to req.user.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void | Response {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ success: false, error: { message: "Authentication required", code: "UNAUTHORIZED" } });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as {
      userId: string;
      phone: string;
      role: Role;
      schoolId: string;
    };
    req.user = decoded;
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, error: { message: "Session expired", code: "TOKEN_EXPIRED" } });
    }
    return res.status(401).json({ success: false, error: { message: "Invalid token", code: "INVALID_TOKEN" } });
  }
}

/**
 * optionalAuth - attaches user if token present, but doesn't require it.
 * Used for public routes that can show extra info when logged in.
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = getTokenFromHeader(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as {
      userId: string;
      phone: string;
      role: Role;
      schoolId: string;
    };
    req.user = decoded;
  } catch {
    // ignore invalid tokens for optional auth
  }
  next();
}

/**
 * authorizeRole(roles) - role guard. User must have one of the listed roles.
 */
export function authorizeRole(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { message: "Authentication required", code: "UNAUTHORIZED" } });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { message: "Forbidden - insufficient role", code: "FORBIDDEN" } });
    }
    return next();
  };
}

/**
 * ensureSameSchool - user can only access resources within their own school.
 * Admins/teachers/students/parents are bound to schoolId.
 */
export function ensureSameSchool(paramUserId = "userId") {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { message: "Authentication required", code: "UNAUTHORIZED" } });
    }
    const targetId = (req.params as Record<string, string>)[paramUserId] || req.body[paramUserId];
    if (targetId && targetId !== req.user.userId) {
      // Allow admins to cross? No—keep strict to school. Admin should pass school-scoped ids.
      return res.status(403).json({ success: false, error: { message: "Access to other user's data is forbidden", code: "FORBIDDEN" } });
    }
    return next();
  };
}

export { ACCESS_SECRET, REFRESH_SECRET };
