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
}
