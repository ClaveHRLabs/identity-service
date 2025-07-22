import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../utils/jwt';
import { getUserById } from '../../db/user';
import { logger } from '../../utils/logger';
import { AppError } from './error-handler';

// Add user property to Express Request
declare global {
    namespace Express {
        interface Request {
            user?: any;
            userId?: string;
            isServiceRequest?: boolean; // Added for service auth check
        }
    }
}

/**
 * Authentication middleware that verifies the JWT token in the Authorization header
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Skip token authentication if already authenticated by service auth
        if (req.isServiceRequest === true) {
            return next();
        }

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError('No authorization token provided', 401, 'UNAUTHORIZED');
        }

        // Check if the header follows the Bearer token format
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new AppError('Invalid authorization format', 401, 'UNAUTHORIZED');
        }

        const token = parts[1];

        // Verify the token
        const payload = await verifyAccessToken(token);

        // Set the user ID on the request
        req.userId = payload.sub;

        next();
    } catch (error) {
        logger.warn('Authentication failed', { error });
        next(new AppError('Authentication failed', 401, 'UNAUTHORIZED'));
    }
};

/**
 * Optional authentication middleware that sets the user if a valid token is provided
 * but doesn't block the request if no token or an invalid token is provided
 */
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next();
        }

        // Check if the header follows the Bearer token format
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return next();
        }

        const token = parts[1];

        // Verify the token
        const payload = await verifyAccessToken(token);

        // Set the user ID on the request
        req.userId = payload.sub;

        next();
    } catch (error) {
        // Don't block the request, just proceed without authentication
        next();
    }
};

/**
 * Middleware to load the complete user object
 * This should be used after the authenticate middleware
 */
export const loadUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.userId) {
            return next();
        }

        const user = await getUserById(req.userId);

        if (!user) {
            throw new AppError('User not found', 401, 'UNAUTHORIZED');
        }

        // Set the user on the request
        req.user = user;

        next();
    } catch (error) {
        logger.error('Error loading user', { error, userId: req.userId });
        next(error);
    }
}; 