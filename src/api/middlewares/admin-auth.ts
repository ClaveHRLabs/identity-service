import { Request, Response, NextFunction } from 'express';
import { Config } from '../../config/config';
import { logger } from '../../utils/logger';
import { AppError } from './error-handler';

/**
 * Middleware to verify admin key in the request header
 */
export const verifyAdminKey = (req: Request, res: Response, next: NextFunction): void => {
    const adminKey = req.header('x-clavehr-admin-key');

    if (!adminKey) {
        logger.warn('Admin key missing in request');
        throw new AppError('Admin authentication required', 401, 'UNAUTHORIZED');
    }

    if (adminKey !== Config.ADMIN_KEY) {
        logger.warn('Invalid admin key provided');
        throw new AppError('Invalid admin credentials', 403, 'FORBIDDEN');
    }

    next();
}; 