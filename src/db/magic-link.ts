import db from './db';
import { MagicLink, CreateMagicLink } from '../models/schemas/user';
import { generateToken } from '../utils/token-generator';

/**
 * Create a new magic link
 */
export async function createMagicLink(data: CreateMagicLink): Promise<MagicLink> {
    // Generate a secure random token
    const token = generateToken(48);

    // Calculate expiration time (default 30 minutes)
    const expirationMinutes = data.expiration_minutes || 30;
    const expires_at = new Date();
    expires_at.setMinutes(expires_at.getMinutes() + expirationMinutes);

    const result = await db.query(
        `INSERT INTO magic_links (
            email, token, expires_at, metadata
        ) VALUES ($1, $2, $3, $4) 
        RETURNING *`,
        [
            data.email,
            token,
            expires_at,
            data.metadata || {}
        ]
    );

    return result.rows[0];
}

/**
 * Get magic link by token
 */
export async function getMagicLinkByToken(token: string): Promise<MagicLink | null> {
    const result = await db.query(
        'SELECT * FROM magic_links WHERE token = $1',
        [token]
    );
    return result.rows[0] || null;
}

/**
 * Get magic links by email
 */
export async function getMagicLinksByEmail(email: string): Promise<MagicLink[]> {
    const result = await db.query(
        'SELECT * FROM magic_links WHERE email = $1 ORDER BY created_at DESC',
        [email]
    );
    return result.rows;
}

/**
 * Mark magic link as used
 */
export async function markMagicLinkAsUsed(id: string): Promise<MagicLink | null> {
    const now = new Date();
    const result = await db.query(
        `UPDATE magic_links 
         SET used = true, used_at = $1 
         WHERE id = $2 
         RETURNING *`,
        [now, id]
    );
    return result.rows[0] || null;
}

/**
 * Validate magic link token
 */
export async function validateMagicLink(token: string): Promise<{
    valid: boolean;
    magicLink: MagicLink | null;
    message?: string;
}> {
    const magicLink = await getMagicLinkByToken(token);

    if (!magicLink) {
        return { valid: false, magicLink: null, message: 'Invalid magic link token' };
    }

    if (magicLink.used) {
        return { valid: false, magicLink, message: 'Magic link has already been used' };
    }

    const now = new Date();
    if (magicLink.expires_at < now) {
        return { valid: false, magicLink, message: 'Magic link has expired' };
    }

    return { valid: true, magicLink };
}

/**
 * Clean up expired or used magic links
 */
export async function cleanupMagicLinks(): Promise<number> {
    const now = new Date();

    const result = await db.query(
        `DELETE FROM magic_links 
         WHERE expires_at < $1 OR used = true 
         RETURNING id`,
        [now]
    );

    return result.rowCount || 0;
} 