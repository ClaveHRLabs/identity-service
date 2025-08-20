import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../services/user.service';
import { logger } from '../../utils/logger';

export class UserController {
    private readonly userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    /**
     * Create a new user
     */
    async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userData = req.body;
            const user = await this.userService.createUser(userData);

            res.status(201).json({
                success: true,
                data: user,
            });
        } catch (error) {
            logger.error('Error creating user', { error });
            next(error);
        }
    }

    /**
     * Get user by ID
     */
    async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
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
        } catch (error) {
            logger.error('Error getting user', { error, id: req.params.id });
            next(error);
        }
    }

    /**
     * Get current authenticated user
     */
    async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
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
        } catch (error) {
            logger.error('Error getting current user', { error, userId: req.userId });
            next(error);
        }
    }

    /**
     * Update user
     */
    async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
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
        } catch (error) {
            logger.error('Error updating user', { error, id: req.params.id });
            next(error);
        }
    }

    /**
     * Delete user
     */
    async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
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
        } catch (error) {
            logger.error('Error deleting user', { error, id: req.params.id });
            next(error);
        }
    }

    /**
     * List users with optional filtering
     */
    async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { organization_id, status, email, limit = '100', offset = '0' } = req.query;

            const filters: {
                organization_id?: string;
                status?: string;
                email?: string;
            } = {};

            if (organization_id) filters.organization_id = organization_id as string;
            if (status) filters.status = status as string;
            if (email) filters.email = email as string;

            const result = await this.userService.listUsers(Number(limit), Number(offset), filters.organization_id);

            res.status(200).json({
                success: true,
                data: {
                    items: result.users,
                    total: result.total,
                    limit: Number(limit),
                    offset: Number(offset),
                },
            });
        } catch (error) {
            logger.error('Error listing users', { error, query: req.query });
            next(error);
        }
    }
}
