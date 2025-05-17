import { z } from 'zod';
import {
    CreateOrganizationProfileSchema,
    UpdateOrganizationProfileSchema,
    CreateSetupCodeSchema,
    ValidateSetupCodeSchema
} from '../../models/schemas/organization';

// Organization profile request validators
export const CreateOrganizationProfileValidator = z.object({
    body: CreateOrganizationProfileSchema
});

export const UpdateOrganizationProfileValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid organization ID')
    }),
    body: UpdateOrganizationProfileSchema
});

export const GetOrganizationProfileValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid organization ID')
    })
});

export const DeleteOrganizationProfileValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid organization ID')
    })
});

export const ListOrganizationProfilesValidator = z.object({
    query: z.object({
        status: z.enum(['active', 'inactive', 'suspended']).optional(),
        subscription_tier: z.enum(['free', 'basic', 'pro', 'enterprise']).optional(),
        limit: z.string().transform(Number).optional(),
        offset: z.string().transform(Number).optional()
    })
});

// Branding update validator - only for branding-related fields
export const UpdateOrganizationBrandingValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid organization ID')
    }),
    body: z.object({
        logo_url: z.string().url('Invalid logo URL').optional().or(z.literal('')),
        primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid primary color format').optional(),
        secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid secondary color format').optional().or(z.literal(''))
    })
});

// Complete organization setup validator
export const CompleteOrganizationSetupValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid organization ID')
    }),
    body: z.object({}).optional() // No body required
});

// Setup code request validators
export const CreateSetupCodeValidator = z.object({
    body: CreateSetupCodeSchema
});

export const GetSetupCodeValidator = z.object({
    params: z.object({
        code: z.string().min(6, 'Invalid setup code')
    })
});

export const ValidateSetupCodeValidator = z.object({
    body: ValidateSetupCodeSchema
});

export const DeleteSetupCodeValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid setup code ID')
    })
});

export const ListSetupCodesValidator = z.object({
    params: z.object({
        organizationId: z.string().uuid('Invalid organization ID')
    }),
    query: z.object({
        includeUsed: z.string()
            .transform(value => value === 'true')
            .optional()
    })
}); 