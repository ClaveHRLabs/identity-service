import { query } from './index';
import { AuthProvider, CreateAuthProvider } from '../models/schemas/user';

/**
 * Create a new authentication provider
 */
export async function createAuthProvider(data: CreateAuthProvider): Promise<AuthProvider> {
    const result = await query(
        `INSERT INTO auth_providers (
            user_id, provider_type, provider_user_id, email, 
            access_token, refresh_token, token_expires_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (provider_type, email) DO UPDATE SET
            provider_user_id = EXCLUDED.provider_user_id,
            access_token = EXCLUDED.access_token,
            refresh_token = EXCLUDED.refresh_token,
            token_expires_at = EXCLUDED.token_expires_at,
            metadata = EXCLUDED.metadata
        RETURNING *`,
        [
            data.user_id,
            data.provider_type,
            data.provider_user_id || null,
            data.email,
            data.access_token || null,
            data.refresh_token || null,
            data.token_expires_at || null,
            data.metadata || {},
        ],
    );

    return result.rows[0];
}

/**
 * Get auth provider by user ID and provider type
 */
export async function getAuthProviderByUserAndType(
    userId: string,
    providerType: string,
): Promise<AuthProvider | null> {
    const result = await query(
        'SELECT * FROM auth_providers WHERE user_id = $1 AND provider_type = $2',
        [userId, providerType],
    );
    return result.rows[0] || null;
}

/**
 * Get auth provider by email and provider type
 */
export async function getAuthProviderByEmailAndType(
    email: string,
    providerType: string,
): Promise<AuthProvider | null> {
    const result = await query(
        'SELECT * FROM auth_providers WHERE email = $1 AND provider_type = $2',
        [email, providerType],
    );
    return result.rows[0] || null;
}

/**
 * Get auth provider by provider user ID and provider type
 */
export async function getAuthProviderByProviderUserId(
    providerType: string,
    providerUserId: string,
): Promise<AuthProvider | null> {
    const result = await query(
        'SELECT * FROM auth_providers WHERE provider_type = $1 AND provider_user_id = $2',
        [providerType, providerUserId],
    );
    return result.rows[0] || null;
}

/**
 * Get all auth providers for a user
 */
export async function getAuthProvidersByUserId(userId: string): Promise<AuthProvider[]> {
    const result = await query('SELECT * FROM auth_providers WHERE user_id = $1', [userId]);
    return result.rows;
}

/**
 * Update auth provider tokens
 */
export async function updateAuthProviderTokens(
    id: string,
    accessToken: string,
    refreshToken: string | null,
    expiresAt: Date | null,
): Promise<AuthProvider | null> {
    const result = await query(
        `UPDATE auth_providers 
         SET access_token = $1, refresh_token = $2, token_expires_at = $3 
         WHERE id = $4 
         RETURNING *`,
        [accessToken, refreshToken, expiresAt, id],
    );
    return result.rows[0] || null;
}

/**
 * Delete auth provider
 */
export async function deleteAuthProvider(id: string): Promise<boolean> {
    const result = await query('DELETE FROM auth_providers WHERE id = $1 RETURNING id', [id]);
    return result.rowCount ? result.rowCount > 0 : false;
}

/**
 * Delete all auth providers for a user
 */
export async function deleteAuthProvidersByUserId(userId: string): Promise<number> {
    const result = await query('DELETE FROM auth_providers WHERE user_id = $1 RETURNING id', [
        userId,
    ]);
    return result.rowCount || 0;
}
