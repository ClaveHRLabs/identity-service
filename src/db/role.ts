import db from './db';
import {
    Role,
    CreateRole,
    UpdateRole,
    Permission,
    CreatePermission,
    UpdatePermission,
    UserRole,
    RolePermission,
    AssignRole,
    AssignPermission
} from '../models/schemas/role';
import { logger } from '../utils/logger';

/**
 * Role Management Functions
 */

// Create a new role
export async function createRole(data: CreateRole): Promise<Role> {
    const result = await db.query(
        `INSERT INTO roles (name, description) 
         VALUES ($1, $2) 
         RETURNING *`,
        [data.name, data.description || null]
    );

    return result.rows[0];
}

// Get role by ID
export async function getRoleById(id: string): Promise<Role | null> {
    const result = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
    return result.rows[0] || null;
}

// Get role by name
export async function getRoleByName(name: string): Promise<Role | null> {
    const result = await db.query('SELECT * FROM roles WHERE name = $1', [name]);
    return result.rows[0] || null;
}

// Update role
export async function updateRole(id: string, data: UpdateRole): Promise<Role | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
    }

    if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
    }

    if (updates.length === 0) {
        return getRoleById(id);
    }

    values.push(id);

    const query = `
        UPDATE roles 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *
    `;

    try {
        const result = await db.query(query, values);
        return result.rows[0] || null;
    } catch (error) {
        logger.error('Error updating role', { error, roleId: id });
        throw error;
    }
}

// Delete role
export async function deleteRole(id: string): Promise<boolean> {
    const result = await db.query('DELETE FROM roles WHERE id = $1 RETURNING id', [id]);
    return result.rowCount ? result.rowCount > 0 : false;
}

// List roles with pagination
export async function getRoles(limit = 100, offset = 0): Promise<Role[]> {
    const result = await db.query(
        'SELECT * FROM roles ORDER BY name ASC LIMIT $1 OFFSET $2',
        [limit, offset]
    );
    return result.rows;
}

// Count total roles
export async function countRoles(): Promise<number> {
    const result = await db.query('SELECT COUNT(*) FROM roles');
    return parseInt(result.rows[0].count);
}

/**
 * Permission Management Functions
 */

// Create a new permission
export async function createPermission(data: CreatePermission): Promise<Permission> {
    const result = await db.query(
        `INSERT INTO permissions (name, description) 
         VALUES ($1, $2) 
         RETURNING *`,
        [data.name, data.description || null]
    );

    return result.rows[0];
}

// Get permission by ID
export async function getPermissionById(id: string): Promise<Permission | null> {
    const result = await db.query('SELECT * FROM permissions WHERE id = $1', [id]);
    return result.rows[0] || null;
}

// Get permission by name
export async function getPermissionByName(name: string): Promise<Permission | null> {
    const result = await db.query('SELECT * FROM permissions WHERE name = $1', [name]);
    return result.rows[0] || null;
}

// Update permission
export async function updatePermission(id: string, data: UpdatePermission): Promise<Permission | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
    }

    if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
    }

    if (updates.length === 0) {
        return getPermissionById(id);
    }

    values.push(id);

    const query = `
        UPDATE permissions 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *
    `;

    try {
        const result = await db.query(query, values);
        return result.rows[0] || null;
    } catch (error) {
        logger.error('Error updating permission', { error, permissionId: id });
        throw error;
    }
}

// Delete permission
export async function deletePermission(id: string): Promise<boolean> {
    const result = await db.query('DELETE FROM permissions WHERE id = $1 RETURNING id', [id]);
    return result.rowCount ? result.rowCount > 0 : false;
}

// List permissions with pagination
export async function getPermissions(limit = 100, offset = 0): Promise<Permission[]> {
    const result = await db.query(
        'SELECT * FROM permissions ORDER BY name ASC LIMIT $1 OFFSET $2',
        [limit, offset]
    );
    return result.rows;
}

// Count total permissions
export async function countPermissions(): Promise<number> {
    const result = await db.query('SELECT COUNT(*) FROM permissions');
    return parseInt(result.rows[0].count);
}

/**
 * User Role Assignment Functions
 */

// Assign role to user
export async function assignRoleToUser(data: AssignRole): Promise<UserRole> {
    const result = await db.query(
        `INSERT INTO user_roles (user_id, role_id, organization_id) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (user_id, role_id, organization_id) DO UPDATE 
         SET updated_at = NOW() 
         RETURNING *`,
        [data.user_id, data.role_id, data.organization_id || null]
    );

    return result.rows[0];
}

// Remove role from user
export async function removeRoleFromUser(
    userId: string,
    roleId: string,
    organizationId?: string
): Promise<boolean> {
    let query = 'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2';
    const values: any[] = [userId, roleId];

    if (organizationId) {
        query += ' AND organization_id = $3';
        values.push(organizationId);
    } else {
        query += ' AND organization_id IS NULL';
    }

    query += ' RETURNING user_id';

    const result = await db.query(query, values);
    return result.rowCount ? result.rowCount > 0 : false;
}

// Get user's roles
export async function getUserRoles(
    userId: string,
    organizationId?: string
): Promise<{ role: Role; userRole: UserRole }[]> {
    let query = `
        SELECT r.*, ur.user_id, ur.organization_id, ur.created_at as user_role_created_at, ur.updated_at as user_role_updated_at 
        FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = $1
    `;
    const values: any[] = [userId];

    if (organizationId) {
        query += ' AND ur.organization_id = $2';
        values.push(organizationId);
    }

    query += ' ORDER BY r.name ASC';

    const result = await db.query(query, values);

    return result.rows.map(row => ({
        role: {
            id: row.id,
            name: row.name,
            description: row.description,
            created_at: row.created_at,
            updated_at: row.updated_at
        },
        userRole: {
            user_id: row.user_id,
            role_id: row.id,
            organization_id: row.organization_id,
            created_at: row.user_role_created_at,
            updated_at: row.user_role_updated_at
        }
    }));
}

// Check if user has specific role
export async function userHasRole(
    userId: string,
    roleName: string,
    organizationId?: string
): Promise<boolean> {
    let query = `
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1 AND r.name = $2
    `;
    const values: any[] = [userId, roleName];

    if (organizationId) {
        query += ' AND ur.organization_id = $3';
        values.push(organizationId);
    } else {
        query += ' AND ur.organization_id IS NULL';
    }

    const result = await db.query(query, values);
    return result.rowCount ? result.rowCount > 0 : false;
}

/**
 * Role Permission Functions
 */

// Assign permission to role
export async function assignPermissionToRole(data: AssignPermission): Promise<RolePermission> {
    const result = await db.query(
        `INSERT INTO role_permissions (role_id, permission_id) 
         VALUES ($1, $2) 
         ON CONFLICT (role_id, permission_id) DO NOTHING 
         RETURNING *`,
        [data.role_id, data.permission_id]
    );

    return result.rows[0];
}

// Remove permission from role
export async function removePermissionFromRole(
    roleId: string,
    permissionId: string
): Promise<boolean> {
    const result = await db.query(
        'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2 RETURNING role_id',
        [roleId, permissionId]
    );
    return result.rowCount ? result.rowCount > 0 : false;
}

// Get role's permissions
export async function getRolePermissions(roleId: string): Promise<Permission[]> {
    const result = await db.query(
        `SELECT p.* FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         WHERE rp.role_id = $1
         ORDER BY p.name ASC`,
        [roleId]
    );
    return result.rows;
}

// Check if user has permission
export async function userHasPermission(
    userId: string,
    permissionName: string,
    organizationId?: string
): Promise<boolean> {
    let query = `
        SELECT 1 FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = $1 AND p.name = $2
    `;
    const values: any[] = [userId, permissionName];

    if (organizationId) {
        query += ' AND (ur.organization_id = $3 OR ur.organization_id IS NULL)';
        values.push(organizationId);
    }

    const result = await db.query(query, values);
    return result.rowCount ? result.rowCount > 0 : false;
} 