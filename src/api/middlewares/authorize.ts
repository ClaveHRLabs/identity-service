import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../../services/role.service';
import { AppError } from './error-handler';
import { logger } from '../../utils/logger';

// Initialize the role service
const roleService = new RoleService();

/**
 * Middleware to check if a user has the required permission
 * @param requiredPermission The permission name required for the action
 * @returns Express middleware function
 */
export const authorize = (requiredPermission: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Skip permission check if request is authenticated via setup code
            if (req.setupCode) {
                logger.debug('Bypassing permission check due to valid setup code', {
                    requiredPermission,
                    path: req.path
                });
                return next();
            }

            // If this is a service request that has set permissions, check those directly
            if (req.isServiceRequest === true && req.permissions) {
                // Check if the required permission exists in the permissions array
                if (req.permissions.includes(requiredPermission)) {
                    logger.debug('Permission granted via service auth', {
                        requiredPermission,
                        path: req.path
                    });
                    return next();
                }

                logger.warn('Service request permission denied', {
                    requiredPermission,
                    userPermissions: req.permissions,
                    path: req.path
                });
                
                return next(new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN'));
            }

            // Get user ID from request (set by authentication middleware)
            const userId = req.user?.id;
            if (!userId) {
                return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
            }

            // Get organization ID from request if available
            const organizationId = req.body.organization_id || req.query.organizationId?.toString();

            // Check if user has the required permission
            const hasPermission = await roleService.checkUserPermission(
                userId,
                requiredPermission,
                organizationId
            );

            if (!hasPermission) {
                logger.warn('Permission denied', {
                    userId,
                    requiredPermission,
                    organizationId
                });
                return next(new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN'));
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