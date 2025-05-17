import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { Config } from '../config/config';

// Define custom error class
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    code?: string;
    details?: Record<string, unknown>;

    constructor(message: string, statusCode: number, code?: string, details?: Record<string, unknown>) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Common error types
export class NotFoundError extends AppError {
    constructor(message: string, code = 'RESOURCE_NOT_FOUND', details?: Record<string, unknown>) {
        super(message, 404, code, details);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string, code = 'BAD_REQUEST', details?: Record<string, unknown>) {
        super(message, 400, code, details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', code = 'UNAUTHORIZED', details?: Record<string, unknown>) {
        super(message, 401, code, details);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', code = 'FORBIDDEN', details?: Record<string, unknown>) {
        super(message, 403, code, details);
    }
}

export class ConflictError extends AppError {
    constructor(message: string, code = 'CONFLICT', details?: Record<string, unknown>) {
        super(message, 409, code, details);
    }
}

// Global error handler middleware
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Log the error
    logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        requestId: (req as any).requestId,
    });

    // If it's an operational error (expected)
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            timestamp: new Date().toISOString(),
            requestId: (req as any).requestId,
            error: {
                code: err.code || 'ERROR',
                message: err.message,
                details: Config.SHOW_ERROR_DETAILS ? err.details : undefined,
                stack: Config.SHOW_ERROR_STACK ? err.stack : undefined,
            },
        });
        return;
    }

    // Handle PostgreSQL specific errors
    const pgError = err as any;
    if (pgError.code) {
        // Handle unique constraint violation
        if (pgError.code === '23505') {
            res.status(409).json({
                success: false,
                timestamp: new Date().toISOString(),
                requestId: (req as any).requestId,
                error: {
                    code: 'DUPLICATE_ENTRY',
                    message: 'An entry with the same unique identifier already exists',
                    details: Config.SHOW_ERROR_DETAILS ?
                        { constraint: pgError.constraint, detail: pgError.detail } : undefined,
                    stack: Config.SHOW_ERROR_STACK ? err.stack : undefined,
                },
            });
            return;
        }

        // Handle foreign key violation
        if (pgError.code === '23503') {
            res.status(400).json({
                success: false,
                timestamp: new Date().toISOString(),
                requestId: (req as any).requestId,
                error: {
                    code: 'FOREIGN_KEY_VIOLATION',
                    message: 'The request references a non-existent related resource',
                    details: Config.SHOW_ERROR_DETAILS ?
                        { constraint: pgError.constraint, detail: pgError.detail } : undefined,
                    stack: Config.SHOW_ERROR_STACK ? err.stack : undefined,
                },
            });
            return;
        }
    }

    // Handle unexpected errors (not operational)
    res.status(500).json({
        success: false,
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: Config.IS_PRODUCTION ?
                'An unexpected error occurred' :
                err.message || 'An unexpected error occurred',
            stack: Config.SHOW_ERROR_STACK ? err.stack : undefined,
        },
    });
}; 