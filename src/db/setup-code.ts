import db from './db';
import {
    OrganizationSetupCode,
    CreateSetupCode
} from '../models/schemas/organization';
import { generateRandomCode } from '../utils/code-generator';

/**
 * Create a new setup code for an organization
 */
export async function createSetupCode(data: CreateSetupCode): Promise<OrganizationSetupCode> {
    const { organization_id, expiration_hours = 24, created_by } = data;

    // Generate a random alphanumeric code
    const code = generateRandomCode(10);

    // Calculate expiration time
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + expiration_hours);

    const result = await db.query(
        `INSERT INTO organization_setup_codes (
      organization_id, code, data, expires_at, created_by_admin
    ) VALUES ($1, $2, $3, $4, $5) 
    RETURNING *`,
        [organization_id, code, data.data || {}, expires_at, created_by]
    );

    return result.rows[0];
}

/**
 * Get setup code by code string
 */
export async function getSetupCodeByCode(code: string): Promise<OrganizationSetupCode | null> {
    const result = await db.query(
        'SELECT * FROM organization_setup_codes WHERE code = $1',
        [code]
    );

    return result.rows[0] || null;
}

/**
 * Get all setup codes for an organization
 */
export async function getSetupCodesByOrganization(
    organizationId: string,
    includeUsed = false
): Promise<OrganizationSetupCode[]> {
    let query = 'SELECT * FROM organization_setup_codes WHERE organization_id = $1';
    const params = [organizationId];

    if (!includeUsed) {
        query += ' AND used = false';
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
}

/**
 * Mark a setup code as used
 */
export async function markSetupCodeAsUsed(code: string): Promise<OrganizationSetupCode | null> {
    const now = new Date();

    const result = await db.query(
        `UPDATE organization_setup_codes 
     SET used = true, used_at = $1 
     WHERE code = $2 AND used = false 
     RETURNING *`,
        [now, code]
    );

    return result.rows[0] || null;
}

/**
 * Delete a setup code
 */
export async function deleteSetupCode(id: string): Promise<boolean> {
    const result = await db.query(
        'DELETE FROM organization_setup_codes WHERE id = $1 RETURNING id',
        [id]
    );

    return result.rowCount ? result.rowCount > 0 : false;
}

/**
 * Delete expired setup codes
 */
export async function cleanupExpiredSetupCodes(): Promise<number> {
    const now = new Date();

    const result = await db.query(
        `DELETE FROM organization_setup_codes 
     WHERE expires_at < $1 
     RETURNING id`,
        [now]
    );

    return result.rowCount || 0;
}

/**
 * Validate a setup code
 * 
 * This checks if the code:
 * 1. Exists
 * 2. Is not expired
 * 3. Has not been used already
 */
export async function validateSetupCode(code: string): Promise<{
    valid: boolean;
    setupCode: OrganizationSetupCode | null;
    message?: string;
}> {
    const setupCode = await getSetupCodeByCode(code);

    if (!setupCode) {
        return { valid: false, setupCode: null, message: 'Setup code not found' };
    }

    const now = new Date();
    if (setupCode.expires_at < now) {
        return { valid: false, setupCode, message: 'Setup code has expired' };
    }

    return { valid: true, setupCode };
} 