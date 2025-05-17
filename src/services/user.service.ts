import { logger } from '../utils/logger';
import * as userRepository from '../db/user';
import * as roleRepository from '../db/role';
import { CreateUser, UpdateUser, User } from '../models/schemas/user';
import { AppError } from '../api/middlewares/error-handler';

export class UserService {
    /**
     * Create a new user
     */
    async createUser(userData: CreateUser): Promise<User> {
        logger.info('Creating new user', { email: userData.email });

        try {
            // Check if a user with this email already exists
            const existingUser = await userRepository.getUserByEmail(userData.email);
            if (existingUser) {
                logger.warn('Failed to create user - email already exists', { email: userData.email });
                throw new AppError('User with this email already exists', 409, 'CONFLICT');
            }

            const newUser = await userRepository.createUser(userData);
            logger.info('User created successfully', { id: newUser.id, email: newUser.email });

            // Assign default employee role to the new user
            try {
                // Get the employee role
                const employeeRole = await roleRepository.getRoleByName('employee');
                if (employeeRole) {
                    // Assign the role
                    await roleRepository.assignRoleToUser({
                        user_id: newUser.id,
                        role_id: employeeRole.id,
                        organization_id: userData.organization_id
                    });
                    logger.info('Default employee role assigned to user', {
                        userId: newUser.id,
                        roleId: employeeRole.id
                    });
                } else {
                    logger.warn('Could not find employee role to assign to new user', { userId: newUser.id });
                }
            } catch (roleError) {
                // Don't fail user creation if role assignment fails
                logger.error('Failed to assign default employee role', {
                    userId: newUser.id,
                    error: roleError instanceof Error ? roleError.message : 'Unknown error'
                });
            }

            return newUser;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            logger.error('Failed to create user', {
                error: error instanceof Error ? error.message : 'Unknown error',
                email: userData.email
            });
            throw error;
        }
    }

    /**
     * Get user by ID
     */
    async getUserById(id: string): Promise<User | null> {
        logger.debug('Fetching user by ID', { id });
        return userRepository.getUserById(id);
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<User | null> {
        logger.debug('Fetching user by email', { email });
        return userRepository.getUserByEmail(email);
    }

    /**
     * Update user
     */
    async updateUser(id: string, updateData: UpdateUser): Promise<User | null> {
        logger.info('Updating user', { id });

        try {
            // Check if user exists
            const existingUser = await userRepository.getUserById(id);
            if (!existingUser) {
                logger.warn('Failed to update user - not found', { id });
                return null;
            }

            // Check for email uniqueness if changing email
            if (updateData.email && updateData.email !== existingUser.email) {
                const emailExists = await userRepository.getUserByEmail(updateData.email);
                if (emailExists) {
                    logger.warn('Failed to update user - email already in use', { id, email: updateData.email });
                    throw new AppError('Email already in use', 409, 'CONFLICT');
                }
            }

            const updatedUser = await userRepository.updateUser(id, updateData);
            logger.info('User updated successfully', { id });
            return updatedUser;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            logger.error('Failed to update user', {
                error: error instanceof Error ? error.message : 'Unknown error',
                id
            });
            throw error;
        }
    }

    /**
     * Delete user
     */
    async deleteUser(id: string): Promise<boolean> {
        logger.info('Deleting user', { id });

        try {
            const deleted = await userRepository.deleteUser(id);

            if (deleted) {
                logger.info('User deleted successfully', { id });
            } else {
                logger.warn('Failed to delete user - not found', { id });
            }

            return deleted;
        } catch (error) {
            logger.error('Failed to delete user', {
                error: error instanceof Error ? error.message : 'Unknown error',
                id
            });
            throw error;
        }
    }

    /**
     * Get users with filtering and pagination
     */
    async getUsers(
        filters: { organization_id?: string; status?: string; email?: string } = {},
        limit = 100,
        offset = 0
    ): Promise<{ users: User[]; total: number }> {
        logger.debug('Fetching users with filters', { filters, limit, offset });

        try {
            const [users, total] = await Promise.all([
                userRepository.getUsers(filters, limit, offset),
                userRepository.countUsers(filters)
            ]);

            return { users, total };
        } catch (error) {
            logger.error('Failed to fetch users', {
                error: error instanceof Error ? error.message : 'Unknown error',
                filters
            });
            throw error;
        }
    }

    /**
     * Set email verification status
     */
    async setEmailVerified(id: string, verified: boolean = true): Promise<User | null> {
        logger.info('Setting email verification status', { id, verified });

        try {
            const user = await userRepository.setEmailVerified(id, verified);

            if (user) {
                logger.info('Email verification status updated', { id, verified });
            } else {
                logger.warn('Failed to update email verification status - user not found', { id });
            }

            return user;
        } catch (error) {
            logger.error('Failed to update email verification status', {
                error: error instanceof Error ? error.message : 'Unknown error',
                id
            });
            throw error;
        }
    }

    /**
     * Update last login time
     */
    async updateLastLogin(id: string): Promise<User | null> {
        logger.debug('Updating last login time', { id });
        return userRepository.updateLastLogin(id);
    }
} 