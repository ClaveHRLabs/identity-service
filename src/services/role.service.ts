import logger from '../utils/logger';
import * as roleRepository from '../db/role';
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
import { HttpError, HttpStatusCode, CatchErrors, Measure } from '@vspl/core';

export class RoleService {
    /**
     * Role Management
     */

    // Create a new role
    @CatchErrors()
    @Measure()
    async createRole(roleData: CreateRole): Promise<Role> {
        logger.info('Creating new role', { name: roleData.name });

        // Check if role with this name already exists
        const existingRole = await roleRepository.getRoleByName(roleData.name);
        if (existingRole) {
            logger.warn('Failed to create role - name already exists', { name: roleData.name });
            throw new HttpError(HttpStatusCode.CONFLICT, 'Role with this name already exists');
        }

        const newRole = await roleRepository.createRole(roleData);
        logger.info('Role created successfully', { id: newRole.id, name: newRole.name });
        return newRole;
    }

    // Get role by ID
    @CatchErrors()
    async getRoleById(id: string): Promise<Role | null> {
        logger.debug('Fetching role by ID', { id });
        return roleRepository.getRoleById(id);
    }

    // Get role by name
    @CatchErrors()
    async getRoleByName(name: string): Promise<Role | null> {
        logger.debug('Fetching role by name', { name });
        return roleRepository.getRoleByName(name);
    }

    // Update role
    async updateRole(id: string, updateData: UpdateRole): Promise<Role | null> {
        logger.info('Updating role', { id });

        try {
            // Check if role exists
            const existingRole = await roleRepository.getRoleById(id);
            if (!existingRole) {
                logger.warn('Failed to update role - not found', { id });
                return null;
            }

            // Check for name uniqueness if changing name
            if (updateData.name && updateData.name !== existingRole.name) {
                const nameExists = await roleRepository.getRoleByName(updateData.name);
                if (nameExists) {
                    logger.warn('Failed to update role - name already in use', { id, name: updateData.name });
                    throw new HttpError(HttpStatusCode.CONFLICT, 'Role name already in use');
                }
            }

            const updatedRole = await roleRepository.updateRole(id, updateData);
            logger.info('Role updated successfully', { id });
            return updatedRole;
        } catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }

            logger.error('Failed to update role', {
                error: error instanceof Error ? error.message : 'Unknown error',
                id
            });
            throw error;
        }
    }

    // Delete role
    async deleteRole(id: string): Promise<boolean> {
        logger.info('Deleting role', { id });

        try {
            const deleted = await roleRepository.deleteRole(id);

            if (deleted) {
                logger.info('Role deleted successfully', { id });
            } else {
                logger.warn('Failed to delete role - not found', { id });
            }

            return deleted;
        } catch (error) {
            logger.error('Failed to delete role', {
                error: error instanceof Error ? error.message : 'Unknown error',
                id
            });
            throw error;
        }
    }

    // Get roles with pagination
    async getRoles(
        limit = 100,
        offset = 0
    ): Promise<{ roles: Role[]; total: number }> {
        logger.debug('Fetching roles with pagination', { limit, offset });

        try {
            const [roles, total] = await Promise.all([
                roleRepository.getRoles(limit, offset),
                roleRepository.countRoles()
            ]);

            return { roles, total };
        } catch (error) {
            logger.error('Failed to fetch roles', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Permission Management
     */

    // Create a new permission
    async createPermission(permissionData: CreatePermission): Promise<Permission> {
        logger.info('Creating new permission', { name: permissionData.name });

        try {
            // Check if permission with this name already exists
            const existingPermission = await roleRepository.getPermissionByName(permissionData.name);
            if (existingPermission) {
                logger.warn('Failed to create permission - name already exists', { name: permissionData.name });
                throw new HttpError(HttpStatusCode.CONFLICT, 'Permission with this name already exists');
            }

            const newPermission = await roleRepository.createPermission(permissionData);
            logger.info('Permission created successfully', { id: newPermission.id, name: newPermission.name });
            return newPermission;
        } catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }

            logger.error('Failed to create permission', {
                error: error instanceof Error ? error.message : 'Unknown error',
                name: permissionData.name
            });
            throw error;
        }
    }

    // Get permission by ID
    async getPermissionById(id: string): Promise<Permission | null> {
        logger.debug('Fetching permission by ID', { id });
        return roleRepository.getPermissionById(id);
    }

    // Get permission by name
    async getPermissionByName(name: string): Promise<Permission | null> {
        logger.debug('Fetching permission by name', { name });
        return roleRepository.getPermissionByName(name);
    }

    // Update permission
    async updatePermission(id: string, updateData: UpdatePermission): Promise<Permission | null> {
        logger.info('Updating permission', { id });

        try {
            // Check if permission exists
            const existingPermission = await roleRepository.getPermissionById(id);
            if (!existingPermission) {
                logger.warn('Failed to update permission - not found', { id });
                return null;
            }

            // Check for name uniqueness if changing name
            if (updateData.name && updateData.name !== existingPermission.name) {
                const nameExists = await roleRepository.getPermissionByName(updateData.name);
                if (nameExists) {
                    logger.warn('Failed to update permission - name already in use', { id, name: updateData.name });
                    throw new HttpError(HttpStatusCode.CONFLICT, 'Permission name already in use');
                }
            }

            const updatedPermission = await roleRepository.updatePermission(id, updateData);
            logger.info('Permission updated successfully', { id });
            return updatedPermission;
        } catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }

            logger.error('Failed to update permission', {
                error: error instanceof Error ? error.message : 'Unknown error',
                id
            });
            throw error;
        }
    }

    // Delete permission
    async deletePermission(id: string): Promise<boolean> {
        logger.info('Deleting permission', { id });

        try {
            const deleted = await roleRepository.deletePermission(id);

            if (deleted) {
                logger.info('Permission deleted successfully', { id });
            } else {
                logger.warn('Failed to delete permission - not found', { id });
            }

            return deleted;
        } catch (error) {
            logger.error('Failed to delete permission', {
                error: error instanceof Error ? error.message : 'Unknown error',
                id
            });
            throw error;
        }
    }

    // Get permissions with pagination
    async getPermissions(
        limit = 100,
        offset = 0
    ): Promise<{ permissions: Permission[]; total: number }> {
        logger.debug('Fetching permissions with pagination', { limit, offset });

        try {
            const [permissions, total] = await Promise.all([
                roleRepository.getPermissions(limit, offset),
                roleRepository.countPermissions()
            ]);

            return { permissions, total };
        } catch (error) {
            logger.error('Failed to fetch permissions', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * User Role Management
     */

    // Assign role to user
    async assignRoleToUser(assignData: AssignRole): Promise<UserRole> {
        logger.info('Assigning role to user', {
            userId: assignData.user_id,
            roleId: assignData.role_id,
            organizationId: assignData.organization_id
        });

        try {
            return await roleRepository.assignRoleToUser(assignData);
        } catch (error) {
            logger.error('Failed to assign role to user', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: assignData.user_id,
                roleId: assignData.role_id
            });
            throw error;
        }
    }

    // Assign role to user by role name
    async assignRoleToUserByName(userId: string, roleName: string, organizationId?: string): Promise<UserRole | null> {
        logger.info('Assigning role to user by name', {
            userId,
            roleName,
            organizationId
        });

        try {
            // First check if the role exists
            const role = await this.getRoleByName(roleName);
            if (!role) {
                logger.warn('Role not found for assignment', { roleName });
                throw new HttpError(HttpStatusCode.NOT_FOUND, `Role '${roleName}' not found`);
            }

            // Create assignment data
            const assignData: AssignRole = {
                user_id: userId,
                role_id: role.id,
                organization_id: organizationId
            };

            // Assign the role
            return await roleRepository.assignRoleToUser(assignData);
        } catch (error) {
            logger.error('Failed to assign role to user by name', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                roleName
            });
            throw error;
        }
    }

    // Remove role from user
    async removeRoleFromUser(userId: string, roleId: string, organizationId?: string): Promise<boolean> {
        logger.info('Removing role from user', {
            userId,
            roleId,
            organizationId
        });

        try {
            return await roleRepository.removeRoleFromUser(userId, roleId, organizationId);
        } catch (error) {
            logger.error('Failed to remove role from user', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                roleId
            });
            throw error;
        }
    }

    // Remove role from user by name
    async removeRoleFromUserByName(userId: string, roleName: string, organizationId?: string): Promise<boolean> {
        logger.info('Removing role from user by name', {
            userId,
            roleName,
            organizationId
        });

        try {
            return await roleRepository.removeRoleFromUserByName(userId, roleName, organizationId);
        } catch (error) {
            logger.error('Failed to remove role from user by name', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId,
                roleName
            });
            throw error;
        }
    }

    // Get user's roles
    async getUserRoles(userId: string, organizationId?: string): Promise<{ role: Role; userRole: UserRole }[]> {
        logger.debug('Fetching user roles', { userId, organizationId });
        return roleRepository.getUserRoles(userId, organizationId);
    }

    // Check if user has specific role
    async userHasRole(userId: string, roleName: string, organizationId?: string): Promise<boolean> {
        logger.info('Checking if user has role', { userId, roleName, organizationId });
        return roleRepository.userHasRole(userId, roleName, organizationId);
    }

    /**
     * Permission Assignment
     */

    // Assign permission to role
    async assignPermissionToRole(assignData: AssignPermission): Promise<RolePermission> {
        logger.info('Assigning permission to role', {
            roleId: assignData.role_id,
            permissionId: assignData.permission_id
        });

        try {
            return await roleRepository.assignPermissionToRole(assignData);
        } catch (error) {
            logger.error('Failed to assign permission to role', {
                error: error instanceof Error ? error.message : 'Unknown error',
                roleId: assignData.role_id,
                permissionId: assignData.permission_id
            });
            throw error;
        }
    }

    // Remove permission from role
    async removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
        logger.info('Removing permission from role', { roleId, permissionId });

        try {
            return await roleRepository.removePermissionFromRole(roleId, permissionId);
        } catch (error) {
            logger.error('Failed to remove permission from role', {
                error: error instanceof Error ? error.message : 'Unknown error',
                roleId,
                permissionId
            });
            throw error;
        }
    }

    // Get role's permissions
    async getRolePermissions(roleId: string): Promise<Permission[]> {
        logger.debug('Fetching role permissions', { roleId });
        return roleRepository.getRolePermissions(roleId);
    }

    /**
     * Permission Checks
     */

    // Check if user has permission
    async checkUserPermission(userId: string, permissionName: string, organizationId?: string): Promise<boolean> {
        logger.debug('Checking if user has permission', { userId, permissionName, organizationId });

        // First check for super_admin role (has all permissions)
        const isSuperAdmin = await roleRepository.userHasRole(userId, 'super_admin');
        if (isSuperAdmin) return true;

        // Check for clavehr_operator role if permission is related to organizations
        if (permissionName === 'manage_organizations') {
            const isClaveHrOperator = await roleRepository.userHasRole(userId, 'clavehr_operator');
            if (isClaveHrOperator) return true;
        }

        // Check specific permission
        return roleRepository.userHasPermission(userId, permissionName, organizationId);
    }
} 