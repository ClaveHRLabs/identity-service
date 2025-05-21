import db from './db';
import { RefreshToken, CreateRefreshToken } from '../models/schemas/user';
import { generateToken } from '../utils/token-generator';
import crypto from 'crypto';

/**
 * Hash a token using MD5
 */
function hashToken(token: string): string {
    return crypto.createHash('md5').update(token).digest('hex');
}

/**
 * Create a new refresh token
 */
export async function createRefreshToken(data: CreateRefreshToken): Promise<RefreshToken> {
    // Generate a secure random token if not provided
    const token = data.token || generateToken(64);

    // Hash the token before storing
    const hashedToken = hashToken(token);

    // Calculate expiration time (default 7 days)
    const expirationDays = data.expiration_days || 7;
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + expirationDays);

    const result = await db.query(
        `INSERT INTO refresh_tokens (
            user_id, token, expires_at, device_info
        ) VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [
            data.user_id,
            hashedToken, // Store hashed token
            expires_at,
            data.device_info || {}
        ]
    );

    // If this is a newly generated token (not provided by caller),
    // we need to return the original token in the result
    if (!data.token) {
        result.rows[0].originalToken = token;
    }

    return result.rows[0];
}

/**
 * Get refresh token by token string
 */
export async function getRefreshTokenByToken(token: string): Promise<RefreshToken | null> {
    // Hash the token before querying
    const hashedToken = hashToken(token);

    const result = await db.query(
        'SELECT * FROM refresh_tokens WHERE token = $1',
        [hashedToken]
    );
    return result.rows[0] || null;
}

/**
 * Get refresh tokens by user ID
 */
export async function getRefreshTokensByUserId(userId: string): Promise<RefreshToken[]> {
    const result = await db.query(
        'SELECT * FROM refresh_tokens WHERE user_id = $1 AND revoked = false ORDER BY created_at DESC',
        [userId]
    );
    return result.rows;
}

/**
 * Revoke refresh token
 */
export async function revokeRefreshToken(id: string): Promise<RefreshToken | null> {
    const result = await db.query(
        `UPDATE refresh_tokens 
         SET revoked = true 
         WHERE id = $1 
         RETURNING *`,
        [id]
    );
    return result.rows[0] || null;
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserRefreshTokens(userId: string): Promise<number> {
    const result = await db.query(
        `UPDATE refresh_tokens 
         SET revoked = true 
         WHERE user_id = $1 AND revoked = false 
         RETURNING id`,
        [userId]
    );
    return result.rowCount || 0;
}

/**
 * Validate refresh token
 */
export async function validateRefreshToken(token: string): Promise<{
    valid: boolean;
    refreshToken: RefreshToken | null;
    message?: string;
}> {
    // Hash the token before querying
    const refreshToken = await getRefreshTokenByToken(token);

    if (!refreshToken) {
        return { valid: false, refreshToken: null, message: 'Invalid refresh token' };
    }

    if (refreshToken.revoked) {
        return { valid: false, refreshToken, message: 'Refresh token has been revoked' };
    }

    const now = new Date();
    if (refreshToken.expires_at < now) {
        return { valid: false, refreshToken, message: 'Refresh token has expired' };
    }

    return { valid: true, refreshToken };
}

/**
 * Delete expired or revoked refresh tokens
 */
export async function cleanupRefreshTokens(): Promise<number> {
    const now = new Date();

    const result = await db.query(
        `DELETE FROM refresh_tokens 
         WHERE expires_at < $1 OR revoked = true 
         RETURNING id`,
        [now]
    );

    return result.rowCount || 0;
} 