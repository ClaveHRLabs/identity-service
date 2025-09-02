import { Request, Response } from 'express';
import { UserService } from '../../services/user.service';
import { CatchErrors, Measure } from '@vspl/core';

export class UserController {
    constructor(private readonly userService: UserService) {}

    /**
     * Create a new user
     */

    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'createUser', logLevel: 'info' })
    async createUser(req: Request, res: Response): Promise<void> {
        const userData = req.body;
        const user = await this.userService.createUser(userData);

        res.status(201).json({
            success: true,
            data: user,
        });
    }

    /**
     * Get user by ID
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'getUser', logLevel: 'info' })
    async getUser(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const user = await this.userService.getUserById(id);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    }

    /**
     * Get current authenticated user
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'getCurrentUser', logLevel: 'info' })
    async getCurrentUser(req: Request, res: Response): Promise<void> {
        // User is loaded by the loadUser middleware
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: req.user,
        });
    }

    /**
     * Update user
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'updateUser', logLevel: 'info' })
    async updateUser(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const updateData = req.body;

        const user = await this.userService.updateUser(id, updateData);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    }

    /**
     * Delete user
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'deleteUser', logLevel: 'info' })
    async deleteUser(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const deleted = await this.userService.deleteUser(id);

        if (!deleted) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    }

    /**
     * List users with optional filtering
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'listUsers', logLevel: 'info' })
    async listUsers(req: Request, res: Response): Promise<void> {
        const { organization_id, status, email, limit = '100', offset = '0' } = req.query;

        const filters: {
            organization_id?: string;
            status?: string;
            email?: string;
        } = {};

        if (organization_id) filters.organization_id = organization_id as string;
        if (status) filters.status = status as string;
        if (email) filters.email = email as string;

        const result = await this.userService.listUsers(
            Number(limit),
            Number(offset),
            filters.organization_id,
        );

        res.status(200).json({
            success: true,
            data: {
                items: result.users,
                total: result.total,
                limit: Number(limit),
                offset: Number(offset),
            },
        });
    }
}
