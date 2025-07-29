import { logger } from '../utils/logger';
import * as userRepository from '../db/user';
import * as roleRepository from '../db/role';
import * as organizationRepository from '../db/organization';
import { CreateUser, UpdateUser, User } from '../models/schemas/user';
import { AppError } from '../api/middlewares/error-handler';
import { ROLES } from '../models/enums/constants';

// List of common email providers that should not be used for domain matching
const COMMON_EMAIL_PROVIDERS = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
    'icloud.com', 'aol.com', 'protonmail.com', 'mail.com',
    'zoho.com', 'yandex.com', 'gmx.com', 'live.com',
    'msn.com', 'me.com', 'inbox.com', 'fastmail.com'
];

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
                        const organization = await organizationRepository.findOrganizationByEmailDomain(emailDomain);

                        if (organization) {
                            logger.info('Auto-assigning user to organization based on email domain', {
                                email: userData.email,
                                domain: emailDomain,
                                organizationId: organization.id,
                                organizationName: organization.name
                            });
                            userData.organization_id = organization.id;
                        } else {
                            logger.debug('No matching organization found for email domain', {
                                emailDomain
                            });
                        }
                    } else {
                        logger.debug('Skipping domain matching for common email provider', {
                            emailDomain
                        });
                    }
                }
            }

            const newUser = await userRepository.createUser(userData);
            logger.info('User created successfully', { id: newUser.id, email: newUser.email });


            // Organization ID should exist for setting up the role
            if (!userData.organization_id) {
                return newUser;
            }

            // Assign default role to the new user
            try {
                // Get the appropriate role - if user is the creator of the organization, assign admin role
                const isOrgCreator = userData.is_organization_creator === true;
                const roleName = isOrgCreator ? ROLES.ADMIN : ROLES.EMPLOYEE;
                
                const role = await roleRepository.getRoleByName(roleName);
                if (role) {
                    // Assign the role
                    await roleRepository.assignRoleToUser({
                        user_id: newUser.id,
                        role_id: role.id,
                        organization_id: userData.organization_id
                    });
                    logger.info(`Default ${roleName} role assigned to user`, {
                        userId: newUser.id,
                        roleId: role.id,
                        roleName
                    });
                } else {
                    logger.warn(`Could not find ${roleName} role to assign to new user`, { 
                        userId: newUser.id,
                        roleName
                    });
                }
            } catch (roleError) {
                // Don't fail user creation if role assignment fails
                logger.error('Failed to assign default role', {
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
        }

        throw new AppError('Failed to create user', 500, 'INTERNAL_SERVER_ERROR');
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

    /**
     * Get organization by ID
     */
    async getOrganizationById(id: string): Promise<any | null> {
        logger.debug('Fetching organization by ID', { id });
        try {
            return await organizationRepository.getOrganizationProfileById(id);
        } catch (error) {
            logger.error('Error fetching organization by ID', { 
                error: error instanceof Error ? error.message : 'Unknown error',
                id 
            });
            return null;
        }
    }
} 