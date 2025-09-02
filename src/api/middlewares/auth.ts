import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../utils/jwt';
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

        // set the user information
        req.user = {
            id: payload.sub,
            email: payload.email,
            organizationId: payload.organizationId,
            employeeId: payload.employeeId,
            roles: payload.roles,
            role: payload.role,
            status: payload.status,
            createdAt: payload.createdAt,
            updatedAt: payload.updatedAt,
        };

        logger.debug('User authenticated', {
            userId: req.userId,
        });

        next();
    } catch (error) {
        logger.warn('Authentication failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(new HttpError(HttpStatusCode.UNAUTHORIZED, 'Authentication failed'));
    }
};

// For backwards compatibility
export const authenticate = authMiddleware;
