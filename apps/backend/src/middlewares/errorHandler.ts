import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
    return;
  }

  // Handle known Prisma errors
  if ('code' in err && typeof (err as any).code === 'string') {
    const prismaCode = (err as any).code;
    if (prismaCode === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'A unique constraint violation occurred.',
        details: (err as any).meta,
      });
      return;
    }
    if (prismaCode === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Record not found.',
      });
      return;
    }
  }

  // Check database constraint violation (like chk_inventory_non_negative)
  if (err.message && err.message.includes('chk_inventory_non_negative')) {
    res.status(400).json({
      success: false,
      message: 'Operation aborted: Insufficient stock would cause negative inventory.',
    });
    return;
  }

  console.error('Unhandled Server Error:', err);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(env.NODE_ENV === 'development' ? { stack: err.stack, error: err.message } : {}),
  });
};

