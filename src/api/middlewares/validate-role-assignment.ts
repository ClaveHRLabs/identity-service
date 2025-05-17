import { Request, Response, NextFunction } from 'express';
import { RoleAssignmentService } from '../../services/role-assignment.service';
import { RoleService } from '../../services/role.service';
import { AppError } from './error-handler';
import { logger } from '../../utils/logger';

// Initialize services
const roleAssignmentService = new RoleAssignmentService();
const roleService = new RoleService();

/**
 * Middleware to validate if a user can assign a specific role
 */
export const validateRoleAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get the assigner's user ID (from authenticated user)
        const assignerId = req.user?.id;
        if (!assignerId) {
            return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
        }

        // Get the role to be assigned
        let roleId = req.body.role_id;
        if (!roleId) {
            return next(new AppError('Role ID is required', 400, 'BAD_REQUEST'));
        }

        // Get organization context if available
        const organizationId = req.body.organization_id || req.query.organizationId?.toString();

        // Get the role name from the ID
        const role = await roleService.getRoleById(roleId);
        if (!role) {
            return next(new AppError('Role not found', 404, 'NOT_FOUND'));
        }

        // Validate if the user can assign this role
        const canAssign = await roleAssignmentService.validateRoleAssignment(
            assignerId,
            role.name,
            organizationId
        );

        if (!canAssign) {
            logger.warn('User attempted to assign a role they do not have permission for', {
                assignerId,
                roleId,
                roleName: role.name,
                organizationId
            });
            return next(new AppError('You do not have permission to assign this role', 403, 'FORBIDDEN'));
        }

        // If validated, continue
        next();
    } catch (error) {
        logger.error('Error in role assignment validation', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
};

/**
 * Middleware to get and attach assignable roles to the request
 */
export const getAssignableRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
        }

        const organizationId = req.query.organizationId?.toString();

        const assignableRoles = await roleAssignmentService.getAssignableRoles(userId, organizationId);

        // Attach to request for use in controller
        req.assignableRoles = assignableRoles;

        next();
    } catch (error) {
        logger.error('Error getting assignable roles', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
}; 