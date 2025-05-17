import jwt from 'jsonwebtoken';
import { Config } from '../config/config';
import { User } from '../models/schemas/user';
import * as roleRepository from '../db/role';
import { logger } from '../utils/logger';

// Types
export interface JwtPayload {
    // Standard JWT claims
    sub: string;
    iat: number;
    exp: number;

    // Identity claims
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    roles?: string[];
    status?: string;
    organizationId?: string;

    // Token type
    type: 'access' | 'refresh';

    // Additional data
    metadata?: Record<string, any>;
    additionalData?: Record<string, any>;
}

/**
 * Get the user's primary role name
 * @param userId The user ID
 * @returns The primary role name, or 'employee' as default
 */
async function getUserPrimaryRole(userId: string): Promise<string> {
    try {
        // Get user roles
        const userRoles = await roleRepository.getUserRoles(userId);

        // If no roles assigned, return default
        if (!userRoles || userRoles.length === 0) {
            return 'employee';
        }

        // Define role priority (higher index = higher priority)
        const rolePriority = [
            'employee',
            'team_manager',
            'hiring_manager',
            'recruiter',
            'learning_specialist',
            'succession_planner',
            'hr_manager',
            'organization_manager',
            'organization_admin',
            'clavehr_operator',
            'super_admin'
        ];

        // Sort roles by priority
        const sortedRoles = userRoles
            .map(ur => ur.role.name)
            .sort((a, b) => {
                const priorityA = rolePriority.indexOf(a);
                const priorityB = rolePriority.indexOf(b);
                return priorityB - priorityA;
            });

        // Return highest priority role
        return sortedRoles[0] || 'employee';
    } catch (error) {
        logger.error('Error getting user primary role', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId
        });
        return 'employee';
    }
}

/**
 * Get all user role names
 * @param userId The user ID
 * @returns Array of role names
 */
async function getUserRoleNames(userId: string): Promise<string[]> {
    try {
        const userRoles = await roleRepository.getUserRoles(userId);
        return userRoles.map(ur => ur.role.name);
    } catch (error) {
        logger.error('Error getting user roles', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId
        });
        return ['employee'];
    }
}

/**
 * Generate an access token for a user
 * @param user User object
 * @param additionalData Optional additional data to include in the token
 */
export async function generateAccessToken(user: User, additionalData?: Record<string, any>): Promise<string> {
    // Get user's primary role and all roles
    const [primaryRole, roles] = await Promise.all([
        getUserPrimaryRole(user.id),
        getUserRoleNames(user.id)
    ]);

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        // Use sub as the user ID (JWT standard)
        sub: user.id,

        // Add fields required by gateway-service
        id: user.id,
        email: user.email,
        firstName: user.first_name || undefined,
        lastName: user.last_name || undefined,
        role: primaryRole,
        roles: roles,
        status: user.status || 'active',
        organizationId: user.organization_id,
        type: 'access',
        metadata: user.metadata
    };

    // Add additional data if provided
    if (additionalData) {
        payload.additionalData = additionalData;
    }

    return jwt.sign(payload, Config.JWT_SECRET, {
        expiresIn: Config.JWT_EXPIRATION
    });
}

/**
 * Generate a refresh token JWT (not to be confused with the refresh token in the database)
 */
export async function generateRefreshToken(user: User): Promise<string> {
    // Get user's primary role
    const primaryRole = await getUserPrimaryRole(user.id);

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: user.id,
        id: user.id,
        email: user.email,
        firstName: user.first_name || undefined,
        lastName: user.last_name || undefined,
        role: primaryRole,
        organizationId: user.organization_id,
        type: 'refresh'
    };

    return jwt.sign(payload, Config.JWT_REFRESH_SECRET, {
        expiresIn: Config.JWT_REFRESH_EXPIRATION
    });
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): Promise<JwtPayload> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, Config.JWT_SECRET, (err, decoded) => {
            if (err) {
                return reject(err);
            }

            const payload = decoded as JwtPayload;
            if (payload.type !== 'access') {
                return reject(new Error('Invalid token type'));
            }

            resolve(payload);
        });
    });
}

/**
 * Verify a refresh token JWT
 */
export function verifyRefreshToken(token: string): Promise<JwtPayload> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, Config.JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) {
                return reject(err);
            }

            const payload = decoded as JwtPayload;
            if (payload.type !== 'refresh') {
                return reject(new Error('Invalid token type'));
            }

            resolve(payload);
        });
    });
} 