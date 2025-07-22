import { z } from 'zod';
import {
    CreateRoleSchema,
    UpdateRoleSchema,
    AssignRoleSchema,
    CreatePermissionSchema,
    UpdatePermissionSchema,
    AssignPermissionSchema
} from '../../models/schemas/role';

// Role management validators
export const CreateRoleValidator = z.object({
    body: CreateRoleSchema
});

export const UpdateRoleValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid role ID')
    }),
    body: UpdateRoleSchema
});

export const GetRoleValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid role ID')
    })
});

export const DeleteRoleValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid role ID')
    })
});

export const ListRolesValidator = z.object({
    query: z.object({
        limit: z.string().transform(Number).optional(),
        offset: z.string().transform(Number).optional()
    })
});

// Permission management validators
export const CreatePermissionValidator = z.object({
    body: CreatePermissionSchema
});

export const UpdatePermissionValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid permission ID')
    }),
    body: UpdatePermissionSchema
});

export const GetPermissionValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid permission ID')
    })
});

export const DeletePermissionValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid permission ID')
    })
});

export const ListPermissionsValidator = z.object({
    query: z.object({
        limit: z.string().transform(Number).optional(),
        offset: z.string().transform(Number).optional()
    })
});

// User role assignment validators
export const AssignRoleToUserValidator = z.object({
    body: AssignRoleSchema
});

export const AssignRoleToUserByNameValidator = z.object({
    body: z.object({
        userId: z.string().uuid('Invalid user ID'),
        roleName: z.string().min(1, 'Role name is required'),
        organizationId: z.string().uuid('Invalid organization ID').optional(),
    })
});

export const RemoveRoleFromUserValidator = z.object({
    params: z.object({
        userId: z.string().uuid('Invalid user ID'),
        roleId: z.string().uuid('Invalid role ID')
    }),
    query: z.object({
        organizationId: z.string().uuid('Invalid organization ID').optional()
    })
});

export const RemoveRoleFromUserByNameValidator = z.object({
    params: z.object({
        userId: z.string().uuid('Invalid user ID'),
    }),
    body: z.object({
        roleName: z.string().min(1, 'Role name is required'),
        organizationId: z.string().uuid('Invalid organization ID').optional()
    })
});

export const GetUserRolesValidator = z.object({
    params: z.object({
        userId: z.string().uuid('Invalid user ID')
    }),
    query: z.object({
        organizationId: z.string().uuid('Invalid organization ID').optional()
    })
});

// Permission assignment validators
export const AssignPermissionToRoleValidator = z.object({
    body: AssignPermissionSchema
});

export const RemovePermissionFromRoleValidator = z.object({
    params: z.object({
        roleId: z.string().uuid('Invalid role ID'),
        permissionId: z.string().uuid('Invalid permission ID')
    })
});

export const GetRolePermissionsValidator = z.object({
    params: z.object({
        roleId: z.string().uuid('Invalid role ID')
    })
});

// CheckPermission validator
export const CheckUserPermissionValidator = z.object({
    params: z.object({
        userId: z.string().uuid('Invalid user ID'),
        permissionName: z.string().min(1, 'Permission name is required')
    }),
    query: z.object({
        organizationId: z.string().uuid('Invalid organization ID').optional()
    })
}); 