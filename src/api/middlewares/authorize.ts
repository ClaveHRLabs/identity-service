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