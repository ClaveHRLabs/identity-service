import { z } from 'zod';

// Role schema
export const RoleSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, 'Role name is required'),
    description: z.string().optional(),
    created_at: z.date(),
    updated_at: z.date(),
});

// Permission schema
export const PermissionSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, 'Permission name is required'),
    description: z.string().optional(),
    created_at: z.date(),
    updated_at: z.date(),
});

// UserRole schema
export const UserRoleSchema = z.object({
    user_id: z.string().uuid(),
    role_id: z.string().uuid(),
    organization_id: z.string().uuid().optional(),
    created_at: z.date(),
    updated_at: z.date(),
});

// RolePermission schema
export const RolePermissionSchema = z.object({
    role_id: z.string().uuid(),
    permission_id: z.string().uuid(),
    created_at: z.date(),
});

// Schemas for creating/updating entities
export const CreateRoleSchema = z.object({
    name: z.string().min(1, 'Role name is required'),
    description: z.string().optional(),
});

export const UpdateRoleSchema = CreateRoleSchema.partial();

export const CreatePermissionSchema = z.object({
    name: z.string().min(1, 'Permission name is required'),
    description: z.string().optional(),
});

export const UpdatePermissionSchema = CreatePermissionSchema.partial();

export const AssignRoleSchema = z.object({
    user_id: z.string().uuid('Invalid user ID'),
    role_id: z.string().uuid('Invalid role ID'),
    organization_id: z.string().uuid('Invalid organization ID').optional(),
});

export const AssignPermissionSchema = z.object({
    role_id: z.string().uuid('Invalid role ID'),
    permission_id: z.string().uuid('Invalid permission ID'),
});

// Type exports
export type Role = z.infer<typeof RoleSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type RolePermission = z.infer<typeof RolePermissionSchema>;

export type CreateRole = z.infer<typeof CreateRoleSchema>;
export type UpdateRole = z.infer<typeof UpdateRoleSchema>;
export type CreatePermission = z.infer<typeof CreatePermissionSchema>;
export type UpdatePermission = z.infer<typeof UpdatePermissionSchema>;
export type AssignRole = z.infer<typeof AssignRoleSchema>;
export type AssignPermission = z.infer<typeof AssignPermissionSchema>; 