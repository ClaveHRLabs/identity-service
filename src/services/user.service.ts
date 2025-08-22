import { logger, HttpError, HttpStatusCode, Measure } from '@vspl/core';
import * as userRepository from '../db/user';
import * as roleRepository from '../db/role';
import * as organizationRepository from '../db/organization';
import { CreateUser, UpdateUser, User } from '../models/schemas/user';
import { ROLES } from '../models/enums/constants';
import { PAGINATION } from '../constants/app.constants';
import { DatabaseService } from './database.service';

// List of common email providers that should not be used for domain matching
const COMMON_EMAIL_PROVIDERS = [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'icloud.com',
    'aol.com',
    'protonmail.com',
    'mail.com',
    'zoho.com',
    'yandex.com',
    'gmx.com',
    'live.com',
    'msn.com',
    'me.com',
    'inbox.com',
    'fastmail.com',
];

export class UserService {
    constructor(private database: DatabaseService) {}
    /**
     * Create a new user
     */

    @Measure()
    async createUser(userData: CreateUser): Promise<User> {
        logger.info('Creating new user', { email: userData.email });

        // Check if a user with this email already exists
        const existingUser = await userRepository.getUserByEmail(userData.email);
        if (existingUser) {
            logger.warn('Failed to create user - email already exists', {
                email: userData.email,
            });
            return existingUser;
        }

        // If no organization_id is provided, try to match based on email domain
        if (!userData.organization_id) {
            const emailParts = userData.email.split('@');
            if (emailParts.length === 2) {
                const emailDomain = emailParts[1].toLowerCase();

                // Skip common email providers
                if (!COMMON_EMAIL_PROVIDERS.includes(emailDomain)) {
                    // Try to find a matching organization
                    const organization =
                        await organizationRepository.findOrganizationByEmailDomain(emailDomain);

                    if (organization) {
                        logger.info('Auto-assigning user to organization based on email domain', {
                            email: userData.email,
                            domain: emailDomain,
                            organizationId: organization.id,
                            organizationName: organization.name,
                        });
                        userData.organization_id = organization.id;
                    }
                }
            }
        }

        const newUser = await userRepository.createUser(userData);
        logger.info('User created successfully', { id: newUser.id, email: newUser.email });

        // If the user is assigned to an organization, give them the default "employee" role
        if (userData.organization_id) {
            try {
                await roleRepository.assignRoleToUserByName(
                    newUser.id,
                    ROLES.EMPLOYEE,
                    userData.organization_id,
                );
                logger.info('Assigned default employee role to new user', {
                    userId: newUser.id,
                    organizationId: userData.organization_id,
                });
            } catch (roleError) {
                // Log error but don't fail user creation
                logger.error('Failed to assign default role to new user', {
                    error: roleError instanceof Error ? roleError.message : 'Unknown error',
                    userId: newUser.id,
                });
            }
        }

        return newUser;
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

    @Measure()
    async updateUser(id: string, updateData: UpdateUser): Promise<User> {
        logger.info('Updating user', { id });

        // Check if user exists
        const existingUser = await userRepository.getUserById(id);
        if (!existingUser) {
            logger.warn('Failed to update user - not found', { id });
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found');
        }

        // Check if email is being changed, and if so, ensure it's not in use
        if (updateData.email && updateData.email !== existingUser.email) {
            const emailExists = await userRepository.getUserByEmail(updateData.email);
            if (emailExists && emailExists.id !== id) {
                logger.warn('Failed to update user - email already in use', {
                    id,
                    email: updateData.email,
                });
                throw new HttpError(HttpStatusCode.CONFLICT, 'Email already in use');
            }
        }

        // If changing organization, make sure the organization exists
        if (updateData.organization_id) {
            const organization = await organizationRepository.getOrganizationProfileById(
                updateData.organization_id,
            );
            if (!organization) {
                logger.warn('Failed to update user - organization not found', {
                    id,
                    organizationId: updateData.organization_id,
                });
                throw new HttpError(HttpStatusCode.NOT_FOUND, 'Organization not found');
            }
        }

        const updatedUser = await userRepository.updateUser(id, updateData);
        logger.info('User updated successfully', { id });
        if (!updatedUser) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found after update');
        }
        return updatedUser;
    }

    /**
     * Delete user
     */

    @Measure()
    async deleteUser(id: string): Promise<boolean> {
        logger.info('Deleting user', { id });

        // Check if user exists
        const existingUser = await userRepository.getUserById(id);
        if (!existingUser) {
            logger.warn('Failed to delete user - not found', { id });
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found');
        }

        const deleted = await userRepository.deleteUser(id);
        logger.info('User deleted successfully', { id });
        return deleted;
    }

    /**
     * List users with pagination
     */

    @Measure()
    async listUsers(
        limit: number = PAGINATION.DEFAULT_LIMIT,
        offset: number = PAGINATION.DEFAULT_OFFSET,
        organizationId?: string,
    ): Promise<{ users: User[]; total: number }> {
        logger.debug('Listing users', { limit, offset, organizationId });

        const [users, total] = await Promise.all([
            userRepository.getUsers(),
            userRepository.countUsers({ organization_id: organizationId }),
        ]);

        return { users, total };
    }

    /**
     * Search users by query
     */

    @Measure()
    async searchUsers(
        query: string,
        limit: number = PAGINATION.DEFAULT_LIMIT,
        offset: number = PAGINATION.DEFAULT_OFFSET,
        organizationId?: string,
    ): Promise<{ users: User[]; total: number }> {
        logger.debug('Searching users', { query, limit, offset, organizationId });

        const [users, total] = await Promise.all([
            userRepository.getUsers(), // TODO: implement searchUsers
            userRepository.countUsers({ organization_id: organizationId }),
        ]);

        return { users, total };
    }
}
