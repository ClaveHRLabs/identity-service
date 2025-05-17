export interface Role {
    id: string;
    name: string;
    description?: string;
    created_at: Date;
    updated_at: Date;
}

export interface Permission {
    id: string;
    name: string;
    description?: string;
    created_at: Date;
    updated_at: Date;
}

export interface UserRole {
    user_id: string;
    role_id: string;
    organization_id?: string;
    created_at: Date;
    updated_at: Date;
}

export interface RolePermission {
    role_id: string;
    permission_id: string;
    created_at: Date;
}

export type CreateRoleDto = {
    name: string;
    description?: string;
};

export type UpdateRoleDto = Partial<CreateRoleDto>;

export type CreatePermissionDto = {
    name: string;
    description?: string;
};

export type UpdatePermissionDto = Partial<CreatePermissionDto>;

export type AssignRoleDto = {
    user_id: string;
    role_id: string;
    organization_id?: string;
};

export type AssignPermissionDto = {
    role_id: string;
    permission_id: string;
}; 