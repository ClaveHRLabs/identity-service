import { query } from './index';
import {
    OrganizationProfile,
    CreateOrganizationProfile,
    UpdateOrganizationProfile,
} from '../models/schemas/organization';

/**
 * Get an organization profile by ID
 */
export async function getOrganizationProfileById(id: string): Promise<OrganizationProfile | null> {
    const result = await query('SELECT * FROM organization_profiles WHERE id = $1', [id]);
    return result.rows[0] || null;
}

/**
 * Find organization profile by name (case-insensitive)
 */
export async function findOrganizationProfileByName(
    name: string,
): Promise<OrganizationProfile | null> {
    const result = await query(
        'SELECT * FROM organization_profiles WHERE LOWER(name) = LOWER($1)',
        [name],
    );
    return result.rows[0] || null;
}

/**
 * Create a new organization profile
 */
export async function createOrganizationProfile(
    data: CreateOrganizationProfile,
): Promise<OrganizationProfile> {
    // Create the SQL query dynamically based on provided fields
    const keys = Object.keys(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');

    const values = Object.values(data);

    const result = await query(
        `INSERT INTO organization_profiles (${columns}) 
     VALUES (${placeholders}) 
     RETURNING *`,
        values,
    );

    return result.rows[0];
}

/**
 * Update an organization profile
 */
export async function updateOrganizationProfile(
    id: string,
    data: UpdateOrganizationProfile,
): Promise<OrganizationProfile | null> {
    // Skip update if no data provided
    if (Object.keys(data).length === 0) {
        return getOrganizationProfileById(id);
    }

    const keys = Object.keys(data);
    const values = Object.values(data);

    // Create SET clause for each field to update
    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    const result = await query(
        `UPDATE organization_profiles 
     SET ${setClauses} 
     WHERE id = $${keys.length + 1} 
     RETURNING *`,
        [...values, id],
    );

    return result.rows[0] || null;
}

/**
 * Delete an organization profile
 */
export async function deleteOrganizationProfile(id: string): Promise<boolean> {
    const result = await query('DELETE FROM organization_profiles WHERE id = $1 RETURNING id', [
        id,
    ]);

    return result.rowCount ? result.rowCount > 0 : false;
}

/**
 * Get all organization profiles with optional filtering
 */
export async function getOrganizationProfiles(
    filters: { status?: string; subscription_tier?: string } = {},
    limit = 100,
    offset = 0,
): Promise<OrganizationProfile[]> {
    const queryParams: any[] = [];
    let whereClause = '';

    // Build WHERE clause from filters
    if (Object.keys(filters).length > 0) {
        const filterClauses: string[] = [];

        Object.entries(filters).forEach(([key, value], index) => {
            if (value) {
                filterClauses.push(`${key} = $${index + 1}`);
                queryParams.push(value);
            }
        });

        if (filterClauses.length > 0) {
            whereClause = `WHERE ${filterClauses.join(' AND ')}`;
        }
    }

    // Add pagination parameters
    queryParams.push(limit);
    queryParams.push(offset);

    const result = await query(
        `SELECT * FROM organization_profiles 
     ${whereClause} 
     ORDER BY created_at DESC 
     LIMIT $${queryParams.length - 1} 
     OFFSET $${queryParams.length}`,
        queryParams,
    );

    return result.rows;
}

/**
 * Count organization profiles with optional filtering
 */
export async function countOrganizationProfiles(
    filters: { status?: string; subscription_tier?: string } = {},
): Promise<number> {
    const queryParams: any[] = [];
    let whereClause = '';

    // Build WHERE clause from filters
    if (Object.keys(filters).length > 0) {
        const filterClauses: string[] = [];

        Object.entries(filters).forEach(([key, value], index) => {
            if (value) {
                filterClauses.push(`${key} = $${index + 1}`);
                queryParams.push(value);
            }
        });

        if (filterClauses.length > 0) {
            whereClause = `WHERE ${filterClauses.join(' AND ')}`;
        }
    }

    const result = await query(
        `SELECT COUNT(*) as count FROM organization_profiles ${whereClause}`,
        queryParams,
    );

    return parseInt(result.rows[0].count, 10);
}

/**
 * Find organization by email domain
 * This uses a simple LIKE query to match the email domain with website URLs
 */
export async function findOrganizationByEmailDomain(
    emailDomain: string,
): Promise<OrganizationProfile | null> {
    const result = await query(
        `SELECT * FROM organization_profiles
         WHERE status = 'active'
         AND website IS NOT NULL
         AND website ILIKE $1
         LIMIT 1`,
        [`%${emailDomain}%`],
    );

    return result.rows[0] || null;
}
