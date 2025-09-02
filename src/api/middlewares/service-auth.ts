import { Request, Response, NextFunction } from 'express';
import { logger } from '@vspl/core';
import { getDependency, SERVICE_NAMES } from '../../di';
import { IdentityConfig } from '../../config/config';
import { HttpError, HttpStatusCode } from '@vspl/core';
import { AuthHeader } from '../../constants/app.constants';

/**
 * Middleware for authenticating service-to-service requests
 * This allows services to act on behalf of users using secure service keys
 */
export const serviceAuthMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        // First, check if it's a service request by verifying the service key header exists
        const serviceKey = req.headers[AuthHeader.SERVICE_KEY];
        if (!serviceKey) {
            // No service key provided, continue with regular auth flow
            return next();
        }

        // Get config from DI container
        const config = getDependency<IdentityConfig>(SERVICE_NAMES.CONFIG);

        // If not configured, skip validation (useful for development)
        if (config.SERVICE_API_KEY && config.SERVICE_API_KEY !== serviceKey) {
            logger.warn('Invalid service API key', {
                path: req.path,
                method: req.method,
            });
            return next(new HttpError(HttpStatusCode.UNAUTHORIZED, 'Invalid service API key'));
        }

        logger.debug('Service authentication successful', {
            path: req.path,
            method: req.method,
        });

        // Process all the headers and set up the request properly
        // This will effectively bypass token authentication for service requests
        (req as any).isServiceRequest = true; // Mark as service request

        // Skip regular authentication since this is now fully authenticated via service
        return next();
    } catch (error) {
        logger.error('Error in service authentication middleware', {
            error: error instanceof Error ? error.message : 'Unknown error',
            path: req.path,
        });
        next(error);
    }
};

// Alias for backwards compatibility
export const serviceAuth = serviceAuthMiddleware;
