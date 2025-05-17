import { z } from 'zod';
import {
    CreateUserSchema,
    UpdateUserSchema,
    GoogleAuthSchema,
    MicrosoftAuthSchema,
    SendMagicLinkSchema,
    VerifyMagicLinkSchema
} from '../../models/schemas/user';

// User management validators
export const CreateUserValidator = z.object({
    body: CreateUserSchema
});

export const UpdateUserValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid user ID')
    }),
    body: UpdateUserSchema
});

export const GetUserValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid user ID')
    })
});

export const DeleteUserValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid user ID')
    })
});

export const ListUsersValidator = z.object({
    query: z.object({
        organization_id: z.string().uuid('Invalid organization ID').optional(),
        status: z.enum(['active', 'inactive', 'suspended']).optional(),
        email: z.string().email('Invalid email').optional(),
        limit: z.string().transform(Number).optional(),
        offset: z.string().transform(Number).optional()
    })
});

// Authentication validators
export const GoogleAuthValidator = z.object({
    body: GoogleAuthSchema
});

export const MicrosoftAuthValidator = z.object({
    body: MicrosoftAuthSchema
});

export const SendMagicLinkValidator = z.object({
    body: SendMagicLinkSchema
});

export const VerifyMagicLinkValidator = z.object({
    body: VerifyMagicLinkSchema
});

export const RefreshTokenValidator = z.object({
    body: z.object({
        refresh_token: z.string().min(1, 'Refresh token is required')
    })
});

export const LogoutValidator = z.object({
    body: z.object({
        refresh_token: z.string().min(1, 'Refresh token is required').optional()
    })
});

// Get current user (requires authentication)
export const GetCurrentUserValidator = z.object({}); 