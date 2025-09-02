import { Request, Response } from 'express';
import { RoleService } from '../../services/role.service';
import { CatchErrors, HttpError, HttpStatusCode, Measure } from '@vspl/core';
import { PAGINATION } from '../../constants/app.constants';

export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    /**
     * Role Management Controllers
     */

    // Get all roles with pagination
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'getRoles', logLevel: 'info' })
    async getRoles(req: Request, res: Response) {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : PAGINATION.MAX_LIMIT;
        const offset = req.query.offset
            ? parseInt(req.query.offset as string)
            : PAGINATION.DEFAULT_OFFSET;

        const { roles, total } = await this.roleService.getRoles(limit, offset);

        res.json({
            data: roles,
            meta: {
                total,
                limit,
                offset,
                hasMore: offset + roles.length < total,
            },
        });
    }

    // Get roles that the current user can assign
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'getAssignableRoles', logLevel: 'info' })
    async getAssignableRoles(req: Request, res: Response) {
        // The assignableRoles are attached to the request by middleware
        if (!req.assignableRoles) {
            res.json({ data: [] });
            return;
        }

        // Get the full role objects
        const rolePromises = req.assignableRoles.map((roleName) =>
            this.roleService.getRoleByName(roleName),
        );

        const roles = (await Promise.all(rolePromises)).filter((role) => role !== null);

        res.json({
            data: roles,
        });
    }

    // Create a new role
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'createRole', logLevel: 'info' })
    async createRole(req: Request, res: Response) {
        const newRole = await this.roleService.createRole(req.body);
        res.status(HttpStatusCode.CREATED).json({
            message: 'Role created successfully',
            data: newRole,
        });
    }

    // Get role by ID
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'getRoleById', logLevel: 'info' })
    async getRoleById(req: Request, res: Response) {
        const { id } = req.params;
        const role = await this.roleService.getRoleById(id);

        if (!role) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'Role not found');
        }

        res.json({
            data: role,
        });
    }

    // Update role
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'updateRole', logLevel: 'info' })
    async updateRole(req: Request, res: Response) {
        const { id } = req.params;
        const role = await this.roleService.updateRole(id, req.body);

        if (!role) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'Role not found');
        }

        res.json({
            message: 'Role updated successfully',
            data: role,
        });
    }

    // Delete role
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'deleteRole', logLevel: 'info' })
    async deleteRole(req: Request, res: Response) {
        const { id } = req.params;
        const deleted = await this.roleService.deleteRole(id);

        if (!deleted) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'Role not found');
        }

        res.json({
            message: 'Role deleted successfully',
        });
    }

    /**
     * Permission Management Controllers
     */

    // Get all permissions with pagination
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'getPermissions', logLevel: 'info' })
    async getPermissions(req: Request, res: Response) {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : PAGINATION.MAX_LIMIT;
        const offset = req.query.offset
            ? parseInt(req.query.offset as string)
            : PAGINATION.DEFAULT_OFFSET;

        const { permissions, total } = await this.roleService.getPermissions(limit, offset);

        res.json({
            data: permissions,
            meta: {
                total,
                limit,
                offset,
                hasMore: offset + permissions.length < total,
            },
        });
    }

    // Create a new permission
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'createPermission', logLevel: 'info' })
    async createPermission(req: Request, res: Response) {
        const newPermission = await this.roleService.createPermission(req.body);
        res.status(HttpStatusCode.CREATED).json({
            message: 'Permission created successfully',
            data: newPermission,
        });
    }

    // Get permission by ID
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'getPermissionById', logLevel: 'info' })
    async getPermissionById(req: Request, res: Response) {
        const { id } = req.params;
        const permission = await this.roleService.getPermissionById(id);

        if (!permission) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'Permission not found');
        }

        res.json({
            data: permission,
        });
    }

    // Update permission
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'updatePermission', logLevel: 'info' })
    async updatePermission(req: Request, res: Response) {
        const { id } = req.params;
        const permission = await this.roleService.updatePermission(id, req.body);

        if (!permission) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'Permission not found');
        }

        res.json({
            message: 'Permission updated successfully',
            data: permission,
        });
    }

    // Delete permission
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'deletePermission', logLevel: 'info' })
    async deletePermission(req: Request, res: Response) {
        const { id } = req.params;
        const deleted = await this.roleService.deletePermission(id);

        if (!deleted) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'Permission not found');
        }

        res.json({
            message: 'Permission deleted successfully',
        });
    }

    /**
     * Role-Permission Assignment Controllers
     */

    // Assign permission to role
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'assignPermissionToRole', logLevel: 'info' })
    async assignPermissionToRole(req: Request, res: Response) {
        const { roleId, permissionId } = req.params;

        // Check if role and permission exist
        const role = await this.roleService.getRoleById(roleId);
        if (!role) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'Role not found');
        }

        const permission = await this.roleService.getPermissionById(permissionId);
        if (!permission) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'Permission not found');
        }

        // Assign permission to role
        const assignment = await this.roleService.assignPermissionToRole({
            role_id: roleId,
            permission_id: permissionId,
        });

        res.status(HttpStatusCode.OK).json({
            message: 'Permission assigned to role successfully',
            data: assignment,
        });
    }

    // Remove permission from role
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'removePermissionFromRole', logLevel: 'info' })
    async removePermissionFromRole(req: Request, res: Response) {
        const { roleId, permissionId } = req.params;

        // Remove permission from role
        const removed = await this.roleService.removePermissionFromRole(roleId, permissionId);

        if (!removed) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'Role-permission assignment not found');
        }

        res.json({
            message: 'Permission removed from role successfully',
        });
    }

    // Get role permissions
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'getRolePermissions', logLevel: 'info' })
    async getRolePermissions(req: Request, res: Response) {
        const { roleId } = req.params;

        // Check if role exists
        const role = await this.roleService.getRoleById(roleId);
        if (!role) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'Role not found');
        }

        // Get permissions for role
        const permissions = await this.roleService.getRolePermissions(roleId);

        res.json({
            data: permissions,
        });
    }
}
