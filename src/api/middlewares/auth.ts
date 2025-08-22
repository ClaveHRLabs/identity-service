import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../utils/jwt';
import { getUserById } from '../../db/user';
import { getDependency, SERVICE_NAMES } from '../../di';
import { IdentityConfig } from '../../config/config';
import { logger } from '@vspl/core';
import { HttpError, HttpStatusCode } from '@vspl/core';

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
export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        // Skip token authentication if already authenticated by service auth
        if (req.isServiceRequest === true) {
            return next();
        }

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, 'No authorization token provided');
        }

        // Check if the header follows the Bearer token format
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, 'Invalid authorization format');
        }

        const token = parts[1];

        // Get config from DI container
        const config = getDependency<IdentityConfig>(SERVICE_NAMES.CONFIG);

        // Verify the token
        const payload = await verifyAccessToken(token, config);

        // Set the user ID on the request
        req.userId = payload.sub;

        next();
    } catch (error) {
        logger.warn('Authentication failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(new HttpError(HttpStatusCode.UNAUTHORIZED, 'Authentication failed'));
    }
};

/**
 * Optional authentication middleware that sets the user if a valid token is provided
 * but doesn't block the request if no token or an invalid token is provided
 */
export const optionalAuthenticate = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
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

        // Get config from DI container
        const config = getDependency<IdentityConfig>(SERVICE_NAMES.CONFIG);

        // Verify the token
        const payload = await verifyAccessToken(token, config);

        // Set the user ID on the request
        req.userId = payload.sub;

        next();
    } catch (error) {
        logger.error('Error verifying token', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
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
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, 'User not found');
        }

        // Set the user on the request
        req.user = user;

        next();
    } catch (error) {
        logger.error('Error loading user', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.userId,
        });
        next(error);
    }
};

// For backwards compatibility
export const authenticate = authMiddleware;
