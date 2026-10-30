// =============================================================================
// backend/src/middleware/auth.ts - JWT authentication + role guard
// =============================================================================
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "@config/env";
import type { Role, JwtPayload } from "@shared-types/shared";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

function getTokenFromHeader(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void | Response {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ success: false, error: { message: "Authentication required", code: "UNAUTHORIZED" } });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = decoded;
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, error: { message: "Session expired", code: "TOKEN_EXPIRED" } });
    }
    return res.status(401).json({ success: false, error: { message: "Invalid token", code: "INVALID_TOKEN" } });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = getTokenFromHeader(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = decoded;
  } catch {
    // ignore invalid tokens for optional auth
  }
  next();
}

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

export function ensureSameSchool(paramUserId = "userId") {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { message: "Authentication required", code: "UNAUTHORIZED" } });
    }
    const targetId = (req.params as Record<string, string>)[paramUserId] || req.body[paramUserId];
    if (targetId && targetId !== req.user.userId) {
      return res.status(403).json({ success: false, error: { message: "Access to other user's data is forbidden", code: "FORBIDDEN" } });
    }
    return next();
  };
}

export { env as jwtEnv };
