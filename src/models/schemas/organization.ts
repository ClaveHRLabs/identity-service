import { z } from 'zod';

// Common validation patterns and error messages
const messages = {
    required: 'This field is required',
    invalidUrl: 'Invalid URL format',
    invalidColor: 'Invalid color format (use hex code like #FF5733)',
};

// Color validation regex (hex code)
const colorRegex = /^#[0-9A-Fa-f]{6}$/;

// Base organization profile schema
export const OrganizationProfileSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    industry: z.string().optional(),
    size: z.string().optional(),
    country: z.string().optional(),
    address: z.string().optional(),
    website: z.string().url(messages.invalidUrl).optional(),
    description: z.string().optional(),
    config: z.record(z.any()).optional(),
    logo_url: z.string().url(messages.invalidUrl).optional(),
    primary_color: z.string().regex(colorRegex, messages.invalidColor).optional(),
    secondary_color: z.string().regex(colorRegex, messages.invalidColor).optional(),
    status: z.enum(['active', 'inactive', 'suspended']).default('active'),
    timezone: z.string().default('UTC'),
    locale: z.string().default('en-US'),
    subscription_tier: z.enum(['free', 'basic', 'pro', 'enterprise']).default('basic'),
    subscription_status: z.enum(['trial', 'active', 'expired', 'cancelled']).default('trial'),
    trial_ends_at: z.date().optional(),
    created_at: z.date(),
    updated_at: z.date(),
});

// Schema for creating a new organization profile
export const CreateOrganizationProfileSchema = OrganizationProfileSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
});

// Schema for updating an organization profile
export const UpdateOrganizationProfileSchema = CreateOrganizationProfileSchema.partial();

// Setup code schema
export const OrganizationSetupCodeSchema = z.object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    code: z.string().min(6, 'Code must be at least 6 characters'),
    data: z.record(z.any()).optional(),
    expires_at: z.date(),
    used: z.boolean().default(false),
    used_at: z.date().optional(),
    created_by_admin: z.string().optional(),
    created_at: z.date(),
    updated_at: z.date(),
});

// Schema for creating a setup code
export const CreateSetupCodeSchema = z.object({
    organization_id: z.string().uuid().optional(),
    organization_name: z.string().min(2, 'Organization name must be at least 2 characters').optional(),
    expiration_hours: z.number().positive().default(24),
    data: z.record(z.any()).optional(),
    created_by: z.string().optional(),
})
    .refine(
        data => data.organization_id !== undefined || data.organization_name !== undefined,
        {
            message: 'Either organization_id or organization_name must be provided',
            path: ['organization_id']
        }
    );

// Schema for validating a setup code
export const ValidateSetupCodeSchema = z.object({
    code: z.string().min(6, 'Code must be at least 6 characters'),
});

// Type exports
export type OrganizationProfile = z.infer<typeof OrganizationProfileSchema>;
export type CreateOrganizationProfile = z.infer<typeof CreateOrganizationProfileSchema>;
export type UpdateOrganizationProfile = z.infer<typeof UpdateOrganizationProfileSchema>;
export type OrganizationSetupCode = z.infer<typeof OrganizationSetupCodeSchema>;
export type CreateSetupCode = z.infer<typeof CreateSetupCodeSchema>;
export type ValidateSetupCode = z.infer<typeof ValidateSetupCodeSchema>; 