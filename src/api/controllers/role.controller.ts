import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../../services/role.service';
import { AppError } from '../middlewares/error-handler';

const roleService = new RoleService();

export const roleController = {
    /**
     * Role Management Controllers
     */

    // Get all roles with pagination
    async getRoles(req: Request, res: Response, next: NextFunction) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
            const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

            const { roles, total } = await roleService.getRoles(limit, offset);

            return res.json({
                data: roles,
                meta: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + roles.length < total
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Get roles that the current user can assign
    async getAssignableRoles(req: Request, res: Response, next: NextFunction) {
        try {
            // The assignableRoles are attached to the request by middleware
            if (!req.assignableRoles) {
                return res.json({ data: [] });
            }

            // Get the full role objects
            const rolePromises = req.assignableRoles.map(roleName =>
                roleService.getRoleByName(roleName)
            );

            const roles = (await Promise.all(rolePromises)).filter(role => role !== null);

            return res.json({
                data: roles
            });
        } catch (error) {
            next(error);
        }
    },

    // Get role by ID
    async getRoleById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const role = await roleService.getRoleById(id);

            if (!role) {
                return next(new AppError('Role not found', 404, 'NOT_FOUND'));
            }

            return res.json({ data: role });
        } catch (error) {
            next(error);
        }
    },

    // Create a new role
    async createRole(req: Request, res: Response, next: NextFunction) {
        try {
            const roleData = req.body;
            const newRole = await roleService.createRole(roleData);

            return res.status(201).json({ data: newRole });
        } catch (error) {
            next(error);
        }
    },

    // Update a role
    async updateRole(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const updatedRole = await roleService.updateRole(id, updateData);

            if (!updatedRole) {
                return next(new AppError('Role not found', 404, 'NOT_FOUND'));
            }

            return res.json({ data: updatedRole });
        } catch (error) {
            next(error);
        }
    },

    // Delete a role
    async deleteRole(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const deleted = await roleService.deleteRole(id);

            if (!deleted) {
                return next(new AppError('Role not found', 404, 'NOT_FOUND'));
            }

            return res.status(204).end();
        } catch (error) {
            next(error);
        }
    },

    /**
     * Permission Management Controllers
     */

    // Get all permissions with pagination
    async getPermissions(req: Request, res: Response, next: NextFunction) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
            const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

            const { permissions, total } = await roleService.getPermissions(limit, offset);

            return res.json({
                data: permissions,
                meta: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + permissions.length < total
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Get permission by ID
    async getPermissionById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const permission = await roleService.getPermissionById(id);

            if (!permission) {
                return next(new AppError('Permission not found', 404, 'NOT_FOUND'));
            }

            return res.json({ data: permission });
        } catch (error) {
            next(error);
        }
    },

    // Create a new permission
    async createPermission(req: Request, res: Response, next: NextFunction) {
        try {
            const permissionData = req.body;
            const newPermission = await roleService.createPermission(permissionData);

            return res.status(201).json({ data: newPermission });
        } catch (error) {
            next(error);
        }
    },

    // Update a permission
    async updatePermission(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const updatedPermission = await roleService.updatePermission(id, updateData);

            if (!updatedPermission) {
                return next(new AppError('Permission not found', 404, 'NOT_FOUND'));
            }

            return res.json({ data: updatedPermission });
        } catch (error) {
            next(error);
        }
    },

    // Delete a permission
    async deletePermission(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const deleted = await roleService.deletePermission(id);

            if (!deleted) {
                return next(new AppError('Permission not found', 404, 'NOT_FOUND'));
            }

            return res.status(204).end();
        } catch (error) {
            next(error);
        }
    },

    /**
     * User Role Controllers
     */

    // Get user's roles
    async getUserRoles(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params;
            const organizationId = req.query.organizationId as string | undefined;

            const userRoles = await roleService.getUserRoles(userId, organizationId);

            return res.json({ data: userRoles });
        } catch (error) {
            next(error);
        }
    },

    // Assign role to user
    async assignRoleToUser(req: Request, res: Response, next: NextFunction) {
        try {
            const assignData = req.body;
            const userRole = await roleService.assignRoleToUser(assignData);

            return res.status(201).json({ data: userRole });
        } catch (error) {
            next(error);
        }
    },

    // Remove role from user
    async removeRoleFromUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, roleId } = req.params;
            const organizationId = req.query.organizationId as string | undefined;

            const removed = await roleService.removeRoleFromUser(userId, roleId, organizationId);

            if (!removed) {
                return next(new AppError('Role assignment not found', 404, 'NOT_FOUND'));
            }

            return res.status(204).end();
        } catch (error) {
            next(error);
        }
    },

    /**
     * Role Permission Controllers
     */

    // Get role permissions
    async getRolePermissions(req: Request, res: Response, next: NextFunction) {
        try {
            const { roleId } = req.params;
            const permissions = await roleService.getRolePermissions(roleId);

            return res.json({ data: permissions });
        } catch (error) {
            next(error);
        }
    },

    // Assign permission to role
    async assignPermissionToRole(req: Request, res: Response, next: NextFunction) {
        try {
            const assignData = req.body;
            const rolePermission = await roleService.assignPermissionToRole(assignData);

            return res.status(201).json({ data: rolePermission });
        } catch (error) {
            next(error);
        }
    },

    // Remove permission from role
    async removePermissionFromRole(req: Request, res: Response, next: NextFunction) {
        try {
            const { roleId, permissionId } = req.params;
            const removed = await roleService.removePermissionFromRole(roleId, permissionId);

            if (!removed) {
                return next(new AppError('Permission assignment not found', 404, 'NOT_FOUND'));
            }

            return res.status(204).end();
        } catch (error) {
            next(error);
        }
    },

    /**
     * Permission Check Controller
     */

    // Check if user has permission
    async checkUserPermission(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, permissionName } = req.params;
            const organizationId = req.query.organizationId as string | undefined;

            const hasPermission = await roleService.checkUserPermission(
                userId,
                permissionName,
                organizationId
            );

            return res.json({ data: { hasPermission } });
        } catch (error) {
            next(error);
        }
    }
}; 