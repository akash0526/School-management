// =============================================================================
// @sms/api/src/middleware/errorHandler.ts - Consistent error response shape
// Every API returns: { success: boolean, data?, error?: { message, code } }
// =============================================================================
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logError } from "@utils/logger";

export class AppError extends Error {
  statusCode: number;
  code: string;
  constructor(message: string, statusCode: number = 500, code: string = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response {
  // Log the error
  logError(err.message, { stack: err.stack, url: req.originalUrl, method: req.method });

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
  }

  // Default 500
  return res.status(500).json({
    success: false,
    error: { message: "Internal server error", code: "INTERNAL_ERROR" },
  });
}
