import db from './db';
import { User, CreateUser, UpdateUser } from '../models/schemas/user';
import { logger } from '../utils/logger';

/**
 * Create a new user
 */
export async function createUser(data: CreateUser): Promise<User> {
    const result = await db.query(
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
            data.preferences || {}
        ]
    );

    return result.rows[0];
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
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
        const result = await db.query(query, values);
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
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result.rowCount ? result.rowCount > 0 : false;
}

/**
 * Get users with optional filtering
 */
export async function getUsers(
    filters: { organization_id?: string; status?: string; email?: string } = {},
    limit = 100,
    offset = 0
): Promise<User[]> {
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

    const result = await db.query(query, values);
    return result.rows;
}

/**
 * Count users with the same filters
 */
export async function countUsers(
    filters: { organization_id?: string; status?: string; email?: string } = {}
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

    const result = await db.query(query, values);
    return parseInt(result.rows[0].count);
}

/**
 * Update user's email verification status
 */
export async function setEmailVerified(id: string, verified: boolean = true): Promise<User | null> {
    const result = await db.query(
        'UPDATE users SET email_verified = $1 WHERE id = $2 RETURNING *',
        [verified, id]
    );
    return result.rows[0] || null;
}

/**
 * Update user's last login time
 */
export async function updateLastLogin(id: string): Promise<User | null> {
    const now = new Date();
    const result = await db.query(
        'UPDATE users SET last_login_at = $1 WHERE id = $2 RETURNING *',
        [now, id]
    );
    return result.rows[0] || null;
} 