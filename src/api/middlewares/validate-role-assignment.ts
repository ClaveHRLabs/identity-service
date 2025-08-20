import { Request, Response, NextFunction } from 'express';
import { RoleAssignmentService } from '../../services/role-assignment.service';
import { RoleService } from '../../services/role.service';
import { HttpError, HttpStatusCode } from '@vspl/core';
import logger from '../../utils/logger';

// Initialize services
const roleAssignmentService = new RoleAssignmentService();
const roleService = new RoleService();

// Add property to Express Request
declare global {
    namespace Express {
        interface Request {
            assignableRoles?: any[];
        }
    }
}

/**
 * Middleware to validate if a user can assign a specific role
 */
export const validateRoleAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get the assigner's user ID (from authenticated user)
        const assignerId = req.user?.id;
        if (!assignerId) {
            return next(new HttpError(HttpStatusCode.UNAUTHORIZED, 'Unauthorized'));
        }

        // Get the role to be assigned
        const roleId = req.body.role_id;
        if (!roleId) {
            return next(new HttpError(HttpStatusCode.BAD_REQUEST, 'Role ID is required'));
        }

        // Get organization context if available
        const organizationId = req.body.organization_id || req.query.organizationId?.toString();

        // Get the role name from the ID
        const role = await roleService.getRoleById(roleId);
        if (!role) {
            return next(new HttpError(HttpStatusCode.NOT_FOUND, 'Role not found'));
        }

        // Validate if the user can assign this role
        const canAssign = await roleAssignmentService.validateRoleAssignment(
            assignerId,
            role.name,
            organizationId,
        );

        if (!canAssign) {
            logger.warn('User attempted to assign a role they do not have permission for', {
                assignerId,
                roleId,
                roleName: role.name,
                organizationId,
            });
            return next(
                new HttpError(
                    HttpStatusCode.FORBIDDEN,
                    'You do not have permission to assign this role',
                ),
            );
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
            return next(new HttpError(HttpStatusCode.UNAUTHORIZED, 'Unauthorized'));
        }

        const organizationId = req.query.organizationId?.toString();

        const assignableRoles = await roleAssignmentService.getAssignableRoles(
            userId,
            organizationId,
        );

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
