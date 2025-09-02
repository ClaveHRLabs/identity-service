import { derivePermissions, HttpError, HttpStatusCode } from '@vspl/core';
import { logger, Request, Response, NextFunction } from '@vspl/core';

/**
 * Middleware to check if a user has the required permission
 * @param requiredPermission The permission name required for the action
 * @returns Express middleware function
 */
export const authorizeMiddleware = (requiredPermission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Skip permission check if request is authenticated via setup code
            if ((req as any).setupCode) {
                logger.debug('Bypassing permission check due to valid setup code', {
                    requiredPermission,
                    path: req.path,
                });
                return next();
            }

            // If this is a service request that has set permissions, check those directly
            if (req.isServiceRequest === true) {
                logger.debug('Service request permission granted', {
                    requiredPermission,
                    path: req.path,
                });
                return next();
            }

            // Get user ID from request (set by authentication middleware)
            const userId = req.user?.id;
            if (!userId) {
                return next(new HttpError(HttpStatusCode.UNAUTHORIZED, 'Unauthorized'));
            }

            const user = req.user;
            const organizationId = user?.organizationId;

            logger.debug('Checking permission', {
                userId,
                requiredPermission,
                organizationId,
                roles: user?.roles,
                permissions: derivePermissions(user?.roles),
            });

            if (!derivePermissions(user?.roles).includes(requiredPermission)) {
                logger.warn('Permission denied', {
                    userId,
                    requiredPermission,
                    organizationId,
                });
                return next(
                    new HttpError(
                        HttpStatusCode.FORBIDDEN,
                        'You do not have permission to perform this action',
                    ),
                );
            }

            next();
        } catch (error) {
            logger.error('Error in authorization middleware', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            next(error);
        }
    };
};

// Export for backwards compatibility
export const authorize = authorizeMiddleware;
