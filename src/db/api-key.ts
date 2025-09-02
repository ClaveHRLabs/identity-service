import { logger } from '@vspl/core';

import { query as executeQuery } from './index';
import { ApiKey, CreateApiKey, UpdateApiKey } from '../models/schemas/api-key';

/**
 * Create a new API key
 */
export async function createApiKey(
    data: CreateApiKey & {
        user_id: string;
        key: string;
    },
): Promise<ApiKey> {
    const query = `
        INSERT INTO api_keys (
            user_id, name, description, key, 
            expires_at, rate_limit_per_minute, 
            allowed_ips, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;

    const values = [
        data.user_id,
        data.name,
        data.description || null,
        data.key,
        data.expires_at || null,
        data.rate_limit_per_minute || null,
        data.allowed_ips || null,
        data.metadata || {},
    ];

    try {
        const queryResult = await executeQuery(query, values);
        logger.info('API key created successfully', {
            apiKeyId: queryResult.rows[0].id,
            userId: data.user_id,
            key: data.key,
        });
        return queryResult.rows[0];
    } catch (error) {
        logger.error('Error creating API key', { error, userId: data.user_id });
        throw error;
    }
}

/**
 * Get API key by key
 */
export async function getApiKeyByKey(key: string): Promise<ApiKey | null> {
    const query = `
        SELECT ak.*, u.email as user_email, u.organization_id, u.roles
        FROM api_keys ak
        JOIN users u ON ak.user_id = u.id
        WHERE ak.key = $1 AND ak.is_active = true
        AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
    `;

    try {
        const queryResult = await executeQuery(query, [key]);
        return queryResult.rows.length > 0 ? queryResult.rows[0] : null;
    } catch (error) {
        logger.error('Error getting API key by key', { error, key: key.substring(0, 10) + '...' });
        throw error;
    }
}

/**
 * Get API key by ID
 */
export async function getApiKeyById(id: string): Promise<ApiKey | null> {
    const query = `
        SELECT * FROM api_keys 
        WHERE id = $1
    `;

    try {
        const queryResult = await executeQuery(query, [id]);
        return queryResult.rows.length > 0 ? queryResult.rows[0] : null;
    } catch (error) {
        logger.error('Error getting API key by id', { error, id });
        throw error;
    }
}

/**
 * Get all API keys for a user
 */
export async function getApiKeysByUserId(
    userId: string,
    includeInactive: boolean = false,
): Promise<ApiKey[]> {
    let query = `
        SELECT id, user_id, name, description, key, is_active, 
               expires_at, last_used_at, usage_count, rate_limit_per_minute,
               allowed_ips, metadata, created_at, updated_at
        FROM api_keys 
        WHERE user_id = $1
    `;

    if (!includeInactive) {
        query += ` AND is_active = true`;
    }

    query += ` ORDER BY created_at DESC`;

    try {
        const queryResult = await executeQuery(query, [userId]);
        return queryResult.rows;
    } catch (error) {
        logger.error('Error getting API keys by user_id', { error, userId });
        throw error;
    }
}

/**
 * Update API key
 */
export async function updateApiKey(id: string, data: UpdateApiKey): Promise<ApiKey | null> {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
        setClause.push(`name = $${paramCount++}`);
        values.push(data.name);
    }
    if (data.description !== undefined) {
        setClause.push(`description = $${paramCount++}`);
        values.push(data.description);
    }
    if (data.is_active !== undefined) {
        setClause.push(`is_active = $${paramCount++}`);
        values.push(data.is_active);
    }
    if (data.expires_at !== undefined) {
        setClause.push(`expires_at = $${paramCount++}`);
        values.push(data.expires_at);
    }
    if (data.rate_limit_per_minute !== undefined) {
        setClause.push(`rate_limit_per_minute = $${paramCount++}`);
        values.push(data.rate_limit_per_minute);
    }
    if (data.allowed_ips !== undefined) {
        setClause.push(`allowed_ips = $${paramCount++}`);
        values.push(data.allowed_ips);
    }
    if (data.metadata !== undefined) {
        setClause.push(`metadata = $${paramCount++}`);
        values.push(data.metadata);
    }

    if (setClause.length === 0) {
        return await getApiKeyById(id);
    }

    const query = `
        UPDATE api_keys 
        SET ${setClause.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
    `;

    values.push(id);

    try {
        const queryResult = await executeQuery(query, values);
        if (queryResult.rows.length > 0) {
            logger.info('API key updated successfully', { apiKeyId: id });
            return queryResult.rows[0];
        }
        return null;
    } catch (error) {
        logger.error('Error updating API key', { error, id });
        throw error;
    }
}

/**
 * Update API key usage tracking
 */
export async function updateApiKeyUsage(key: string, lastUsedIp?: string): Promise<void> {
    const query = `
        UPDATE api_keys 
        SET usage_count = usage_count + 1,
            last_used_at = NOW(),
            last_used_ip = COALESCE($2, last_used_ip)
        WHERE key = $1
    `;

    try {
        await executeQuery(query, [key, lastUsedIp || null]);
        logger.debug('API key usage updated', { key: key.substring(0, 10) + '...' });
    } catch (error) {
        logger.error('Error updating API key usage', { error, key: key.substring(0, 10) + '...' });
        // Don't throw here as this is tracking info
    }
}

/**
 * Delete (deactivate) API key
 */
export async function deleteApiKey(id: string): Promise<boolean> {
    const query = `
        UPDATE api_keys 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING id
    `;

    try {
        const queryResult = await executeQuery(query, [id]);
        if (queryResult.rows.length > 0) {
            logger.info('API key deactivated successfully', { apiKeyId: id });
            return true;
        }
        return false;
    } catch (error) {
        logger.error('Error deactivating API key', { error, id });
        throw error;
    }
}

/**
 * Permanently delete API key (for cleanup/admin purposes)
 */
export async function permanentlyDeleteApiKey(id: string): Promise<boolean> {
    const query = `DELETE FROM api_keys WHERE id = $1 RETURNING id`;

    try {
        const queryResult = await executeQuery(query, [id]);
        if (queryResult.rows.length > 0) {
            logger.info('API key permanently deleted', { apiKeyId: id });
            return true;
        }
        return false;
    } catch (error) {
        logger.error('Error permanently deleting API key', { error, id });
        throw error;
    }
}

/**
 * Clean up expired API keys
 */
export async function cleanupExpiredApiKeys(): Promise<number> {
    const query = `
        UPDATE api_keys 
        SET is_active = false, updated_at = NOW()
        WHERE is_active = true 
        AND expires_at IS NOT NULL 
        AND expires_at <= NOW()
        RETURNING id
    `;

    try {
        const queryResult = await executeQuery(query);
        const count = queryResult.rows.length;
        if (count > 0) {
            logger.info('Expired API keys cleaned up', { count });
        }
        return count;
    } catch (error) {
        logger.error('Error cleaning up expired API keys', { error });
        throw error;
    }
}

/**
 * Get API key statistics for a user
 */
export async function getApiKeyStats(userId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    totalUsage: number;
}> {
    const query = `
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN is_active = true THEN 1 END) as active,
            COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at <= NOW() THEN 1 END) as expired,
            COALESCE(SUM(usage_count), 0) as total_usage
        FROM api_keys 
        WHERE user_id = $1
    `;

    try {
        const queryResult = await executeQuery(query, [userId]);
        const row = queryResult.rows[0];
        return {
            total: parseInt(row.total),
            active: parseInt(row.active),
            expired: parseInt(row.expired),
            totalUsage: parseInt(row.total_usage),
        };
    } catch (error) {
        logger.error('Error getting API key stats', { error, userId });
        throw error;
    }
}
