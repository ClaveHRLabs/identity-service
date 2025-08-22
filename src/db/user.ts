import { query as executeQuery } from './index';
import { User, CreateUser, UpdateUser } from '../models/schemas/user';
import { logger } from '@vspl/core';

/**
 * Create a new user
 */
export async function createUser(data: CreateUser): Promise<User> {
    const result = await executeQuery(
        `INSERT INTO users (
            email, first_name, last_name, display_name, avatar_url,
            organization_id, metadata, preferences
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
            data.email,
            data.first_name || null,
            data.last_name || null,
            data.display_name || null,
            data.avatar_url || null,
            data.organization_id || null,
            data.metadata || {},
            data.preferences || {},
        ],
    );

    return result.rows[0];
}

/**
 * Get user by ID with roles
 */
export async function getUserById(id: string): Promise<User | null> {
    try {
        // First get the user
        const userResult = await executeQuery('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rowCount === 0) {
            return null;
        }

        const user = userResult.rows[0];

        // Then get user roles
        const rolesResult = await executeQuery(
            `SELECT r.name 
            FROM roles r 
            INNER JOIN user_roles ur ON r.id = ur.role_id 
            WHERE ur.user_id = $1`,
            [id],
        );

        // Add roles to user object
        user.roles = rolesResult.rows.map((row) => row.name);

        return user;
    } catch (error) {
        logger.error('Error fetching user by ID with roles', { error, userId: id });
        throw error;
    }
}

/**
 * Get employee ID by user ID from employees table
 * @param userId The user ID
 * @param organizationId Optional organization ID for filtering
 * @returns The employee ID or undefined if not found
 */
export async function getEmployeeByUserId(userId: string, organizationId?: string): Promise<any> {
    try {
        // Query to get the employee ID
        const sql = organizationId
            ? 'SELECT * FROM employees_derived WHERE user_id = $1 AND organization_id = $2'
            : 'SELECT * FROM employees_derived WHERE user_id = $1';

        const params = organizationId ? [userId, organizationId] : [userId];

        const result = await executeQuery(sql, params);

        if (result.rows.length > 0) {
            return {
                id: result.rows[0].id,
                managerId: result.rows[0].manager_id,
                department: result.rows[0].department,
                firstName: result.rows[0].first_name,
                lastName: result.rows[0].last_name,
                title: result.rows[0].position,
                internalEmployeeId: result.rows[0].employee_id_number,
                status: result.rows[0].status,
                email: result.rows[0].email,
                city: result.rows[0].city,
                state: result.rows[0].state,
                country: result.rows[0].country,
                zip: result.rows[0].zip,
            };
        }

        return undefined;
    } catch (error) {
        logger.error('Error getting employee ID by user ID', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId,
            organizationId,
        });
        return undefined;
    }
}

/**
 * Get user by email with roles
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    try {
        // First get the user
        const userResult = await executeQuery('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rowCount === 0) {
            return null;
        }

        const user = userResult.rows[0];

        // Then get user roles
        const rolesResult = await executeQuery(
            `SELECT r.name 
            FROM roles r 
            INNER JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = $1`,
            [user.id],
        );

        // Add roles to user object
        user.roles = rolesResult.rows.map((row) => row.name);

        return user;
    } catch (error) {
        logger.error('Error fetching user by email with roles', { error, email });
        throw error;
    }
}

/**
 * Update user
 */
export async function updateUser(id: string, data: UpdateUser): Promise<User | null> {
    // Build the update query dynamically based on the fields to update
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Add each field that is present in the update data
    if (data.email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(data.email);
    }

    if (data.first_name !== undefined) {
        updates.push(`first_name = $${paramIndex++}`);
        values.push(data.first_name);
    }

    if (data.last_name !== undefined) {
        updates.push(`last_name = $${paramIndex++}`);
        values.push(data.last_name);
    }

    if (data.display_name !== undefined) {
        updates.push(`display_name = $${paramIndex++}`);
        values.push(data.display_name);
    }

    if (data.avatar_url !== undefined) {
        updates.push(`avatar_url = $${paramIndex++}`);
        values.push(data.avatar_url);
    }

    if (data.organization_id !== undefined) {
        updates.push(`organization_id = $${paramIndex++}`);
        values.push(data.organization_id);
    }

    if (data.metadata !== undefined) {
        updates.push(`metadata = $${paramIndex++}`);
        values.push(data.metadata);
    }

    if (data.preferences !== undefined) {
        updates.push(`preferences = $${paramIndex++}`);
        values.push(data.preferences);
    }

    // If there are no updates, return the existing user
    if (updates.length === 0) {
        return getUserById(id);
    }

    // Add the user ID as the last parameter
    values.push(id);

    // Execute the update query
    const query = `
        UPDATE users 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *
    `;

    try {
        const result = await executeQuery(query, values);
        return result.rows[0] || null;
    } catch (error) {
        logger.error('Error updating user', { error, userId: id });
        throw error;
    }
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<boolean> {
    const result = await executeQuery('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result.rowCount ? result.rowCount > 0 : false;
}

/**
 * Get users with optional filtering and include roles
 */
export async function getUsers(
    filters: { organization_id?: string; status?: string; email?: string } = {},
    limit = 100,
    offset = 0,
): Promise<User[]> {
    try {
        let query = 'SELECT * FROM users WHERE 1=1';
        const values: any[] = [];
        let paramIndex = 1;

        // Add filters
        if (filters.organization_id) {
            query += ` AND organization_id = $${paramIndex++}`;
            values.push(filters.organization_id);
        }

        if (filters.status) {
            query += ` AND status = $${paramIndex++}`;
            values.push(filters.status);
        }

        if (filters.email) {
            query += ` AND email = $${paramIndex++}`;
            values.push(filters.email);
        }

        // Add pagination
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        values.push(limit, offset);

        const result = await executeQuery(query, values);

        // Get roles for all users
        const users = result.rows;

        // If no users, return empty array
        if (users.length === 0) {
            return [];
        }

        // Get all user IDs
        const userIds = users.map((user) => user.id);

        // Query for all roles for these users in one query
        const rolesQuery = `
            SELECT ur.user_id, r.name 
            FROM roles r 
            INNER JOIN user_roles ur ON r.id = ur.role_id 
            WHERE ur.user_id = ANY($1::uuid[])
        `;

        const rolesResult = await executeQuery(rolesQuery, [userIds]);

        // Create a map of user ID to roles
        const userRolesMap = new Map();

        rolesResult.rows.forEach((row) => {
            if (!userRolesMap.has(row.user_id)) {
                userRolesMap.set(row.user_id, []);
            }
            userRolesMap.get(row.user_id).push(row.name);
        });

        // Add roles to each user
        users.forEach((user) => {
            user.roles = userRolesMap.get(user.id) || [];
        });

        return users;
    } catch (error) {
        logger.error('Error fetching users with roles', { error, filters });
        throw error;
    }
}

/**
 * Count users with the same filters
 */
export async function countUsers(
    filters: { organization_id?: string; status?: string; email?: string } = {},
): Promise<number> {
    let query = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    // Add filters
    if (filters.organization_id) {
        query += ` AND organization_id = $${paramIndex++}`;
        values.push(filters.organization_id);
    }

    if (filters.status) {
        query += ` AND status = $${paramIndex++}`;
        values.push(filters.status);
    }

    if (filters.email) {
        query += ` AND email = $${paramIndex++}`;
        values.push(filters.email);
    }

    const result = await executeQuery(query, values);
    return parseInt(result.rows[0].count);
}

/**
 * Update user's email verification status
 */
export async function setEmailVerified(id: string, verified: boolean = true): Promise<User | null> {
    const result = await executeQuery(
        'UPDATE users SET email_verified = $1 WHERE id = $2 RETURNING *',
        [verified, id],
    );
    return result.rows[0] || null;
}

/**
 * Update user's last login time
 */
export async function updateLastLogin(id: string): Promise<User | null> {
    const now = new Date();
    const result = await executeQuery(
        'UPDATE users SET last_login_at = $1 WHERE id = $2 RETURNING *',
        [now, id],
    );
    return result.rows[0] || null;
}
