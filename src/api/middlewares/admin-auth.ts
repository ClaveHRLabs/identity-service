import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { AppError } from './error-handler';
import { RoleService } from '../../services/role.service';
import { UserRole } from '../../models/enums/roles.enum';

const roleService = new RoleService();

/**
 * Middleware to verify that the user has the ClaveHR Operator role
 * This replaces the previous admin key authentication
 */
export const verifyClaveHROperator = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Get user ID from request (set by authentication middleware)
        const userId = req.user?.id;
        if (!userId) {
            logger.warn('Unauthorized access attempt - no user ID');
            return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
        }

        // Check if user has the clavehr_operator role
        const isOperator = await roleService.userHasRole(userId, UserRole.CLAVEHR_OPERATOR);

        if (!isOperator) {
            logger.warn('Access denied - user is not a ClaveHR Operator', { userId });
            return next(new AppError('Only ClaveHR Operators can perform this action', 403, 'FORBIDDEN'));
        }

        next();
    } catch (error) {
        logger.error('Error verifying ClaveHR Operator role', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
};

/**
 * Middleware to verify that the user has either the Super Admin or ClaveHR Operator role
 */
export const verifyAdminOrOperator = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Get user ID from request (set by authentication middleware)
        const userId = req.user?.id;
        if (!userId) {
            logger.warn('Unauthorized access attempt - no user ID');
            return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
        }

        // Check if user has either the super_admin or clavehr_operator role
        const isSuperAdmin = await roleService.userHasRole(userId, UserRole.SUPER_ADMIN);
        const isOperator = await roleService.userHasRole(userId, UserRole.CLAVEHR_OPERATOR);

        if (!isSuperAdmin && !isOperator) {
            logger.warn('Access denied - user is neither a Super Admin nor a ClaveHR Operator', { userId });
            return next(new AppError('Only Super Admins or ClaveHR Operators can perform this action', 403, 'FORBIDDEN'));
        }

        next();
    } catch (error) {
        logger.error('Error verifying Admin or Operator role', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
}; 