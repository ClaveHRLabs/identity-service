import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../../services/role.service';
import { HttpError, HttpStatusCode } from '@vspl/core';
import { PAGINATION } from '../../constants/app.constants';

const roleService = new RoleService();

export const roleController = {
    /**
     * Role Management Controllers
     */

    // Get all roles with pagination
    async getRoles(req: Request, res: Response, next: NextFunction) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : PAGINATION.MAX_LIMIT;
            const offset = req.query.offset ? parseInt(req.query.offset as string) : PAGINATION.DEFAULT_OFFSET;

            const { roles, total } = await roleService.getRoles(limit, offset);

            return res.json({
                data: roles,
                meta: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + roles.length < total,
                },
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
            const rolePromises = req.assignableRoles.map((roleName) =>
                roleService.getRoleByName(roleName),
            );

            const roles = (await Promise.all(rolePromises)).filter((role) => role !== null);

            return res.json({
                data: roles,
            });
        } catch (error) {
            next(error);
        }
    },

    // Create a new role
    async createRole(req: Request, res: Response, next: NextFunction) {
        try {
            const newRole = await roleService.createRole(req.body);
            return res.status(HttpStatusCode.CREATED).json({
                message: 'Role created successfully',
                data: newRole,
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
                throw new HttpError(HttpStatusCode.NOT_FOUND, 'Role not found');
            }

            return res.json({
                data: role,
            });
        } catch (error) {
            next(error);
        }
    },

    // Update role
    async updateRole(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const role = await roleService.updateRole(id, req.body);

            if (!role) {
                throw new HttpError(HttpStatusCode.NOT_FOUND, 'Role not found');
            }

            return res.json({
                message: 'Role updated successfully',
                data: role,
            });
        } catch (error) {
            next(error);
        }
    },

    // Delete role
    async deleteRole(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const deleted = await roleService.deleteRole(id);

            if (!deleted) {
                throw new HttpError(HttpStatusCode.NOT_FOUND, 'Role not found');
            }

            return res.json({
                message: 'Role deleted successfully',
            });
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
            const limit = req.query.limit ? parseInt(req.query.limit as string) : PAGINATION.MAX_LIMIT;
            const offset = req.query.offset ? parseInt(req.query.offset as string) : PAGINATION.DEFAULT_OFFSET;

            const { permissions, total } = await roleService.getPermissions(limit, offset);

            return res.json({
                data: permissions,
                meta: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + permissions.length < total,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    // Create a new permission
    async createPermission(req: Request, res: Response, next: NextFunction) {
        try {
            const newPermission = await roleService.createPermission(req.body);
            return res.status(HttpStatusCode.CREATED).json({
                message: 'Permission created successfully',
                data: newPermission,
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
                throw new HttpError(HttpStatusCode.NOT_FOUND, 'Permission not found');
            }

            return res.json({
                data: permission,
            });
        } catch (error) {
            next(error);
        }
    },

    // Update permission
    async updatePermission(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const permission = await roleService.updatePermission(id, req.body);

            if (!permission) {
                throw new HttpError(HttpStatusCode.NOT_FOUND, 'Permission not found');
            }

            return res.json({
                message: 'Permission updated successfully',
                data: permission,
            });
        } catch (error) {
            next(error);
        }
    },

    // Delete permission
    async deletePermission(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const deleted = await roleService.deletePermission(id);

            if (!deleted) {
                throw new HttpError(HttpStatusCode.NOT_FOUND, 'Permission not found');
            }

            return res.json({
                message: 'Permission deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Role-Permission Assignment Controllers
     */

    // Assign permission to role
    async assignPermissionToRole(req: Request, res: Response, next: NextFunction) {
        try {
            const { roleId, permissionId } = req.params;

            // Check if role and permission exist
            const role = await roleService.getRoleById(roleId);
            if (!role) {
                throw new HttpError(HttpStatusCode.NOT_FOUND, 'Role not found');
            }

            const permission = await roleService.getPermissionById(permissionId);
            if (!permission) {
                throw new HttpError(HttpStatusCode.NOT_FOUND, 'Permission not found');
            }

            // Assign permission to role
            const assignment = await roleService.assignPermissionToRole({
                role_id: roleId,
                permission_id: permissionId,
            });

            return res.status(HttpStatusCode.OK).json({
                message: 'Permission assigned to role successfully',
                data: assignment,
            });
        } catch (error) {
            next(error);
        }
    },

    // Remove permission from role
    async removePermissionFromRole(req: Request, res: Response, next: NextFunction) {
        try {
            const { roleId, permissionId } = req.params;

            // Remove permission from role
            const removed = await roleService.removePermissionFromRole(roleId, permissionId);

            if (!removed) {
                throw new HttpError(
                    HttpStatusCode.NOT_FOUND,
                    'Role-permission assignment not found',
                );
            }

            return res.json({
                message: 'Permission removed from role successfully',
            });
        } catch (error) {
            next(error);
        }
    },

    // Get role permissions
    async getRolePermissions(req: Request, res: Response, next: NextFunction) {
        try {
            const { roleId } = req.params;

            // Check if role exists
            const role = await roleService.getRoleById(roleId);
            if (!role) {
                throw new HttpError(HttpStatusCode.NOT_FOUND, 'Role not found');
            }

            // Get permissions for role
            const permissions = await roleService.getRolePermissions(roleId);

            return res.json({
                data: permissions,
            });
        } catch (error) {
            next(error);
        }
    },
};
