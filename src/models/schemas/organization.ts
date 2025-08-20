import { z } from 'zod';
import { ORGANIZATION_STATUS, SUBSCRIPTION_TIER, SUBSCRIPTION_STATUS } from '../enums/constants';
import { SESSION, TOKEN, VALIDATION } from '../../constants/app.constants';

// Common validation patterns and error messages
const messages = {
    required: 'This field is required',
    invalidUrl: 'Invalid URL format',
    invalidColor: 'Invalid color format (use hex code like #FF5733)',
};

// Color validation regex (hex code)
const colorRegex = VALIDATION.COLOR_REGEX;

// Organization join settings schema
export const OrganizationJoinSettingsSchema = z.object({
    allow_public_join: z.boolean().default(false),
    require_approval: z.boolean().default(true),
    allow_invite_only: z.boolean().default(true),
    max_members: z.number().positive().optional(),
    auto_approve_domains: z.array(z.string()).default([]),
    blocked_domains: z.array(z.string()).default([]),
});

// Organization login settings schema
export const OrganizationLoginSettingsSchema = z.object({
    allow_email_login: z.boolean().default(true),
    allow_oauth_login: z.boolean().default(true),
    allowed_oauth_providers: z.array(z.string()).default(['google', 'microsoft', 'linkedin']),
    require_mfa: z.boolean().default(false),
    session_timeout_minutes: z.number().positive().default(SESSION.DEFAULT_TIMEOUT_MINUTES),
});

// Base organization profile schema
export const OrganizationProfileSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(VALIDATION.MIN_NAME_LENGTH, 'Name must be at least 2 characters'),
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
    status: z
        .enum([
            ORGANIZATION_STATUS.ACTIVE,
            ORGANIZATION_STATUS.INACTIVE,
            ORGANIZATION_STATUS.SUSPENDED,
        ])
        .default(ORGANIZATION_STATUS.ACTIVE),
    timezone: z.string().default('UTC'),
    locale: z.string().default('en-US'),
    subscription_tier: z
        .enum([
            SUBSCRIPTION_TIER.FREE,
            SUBSCRIPTION_TIER.BASIC,
            SUBSCRIPTION_TIER.PRO,
            SUBSCRIPTION_TIER.ENTERPRISE,
        ])
        .default(SUBSCRIPTION_TIER.BASIC),
    subscription_status: z
        .enum([
            SUBSCRIPTION_STATUS.TRIAL,
            SUBSCRIPTION_STATUS.ACTIVE,
            SUBSCRIPTION_STATUS.EXPIRED,
            SUBSCRIPTION_STATUS.CANCELLED,
        ])
        .default(SUBSCRIPTION_STATUS.TRIAL),
    trial_ends_at: z.date().optional(),
    join_settings: OrganizationJoinSettingsSchema.optional(),
    login_settings: OrganizationLoginSettingsSchema.optional(),
    metadata: z.record(z.any()).optional(),
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
export const CreateSetupCodeSchema = z
    .object({
        organization_id: z.string().uuid().optional(),
        organization_name: z
            .string()
            .min(2, 'Organization name must be at least 2 characters')
            .optional(),
        expiration_hours: z.number().positive().default(TOKEN.DEFAULT_EXPIRATION_HOURS),
        data: z.record(z.any()).optional(),
        created_by: z.string().optional(),
    })
    .refine((data) => data.organization_id !== undefined || data.organization_name !== undefined, {
        message: 'Either organization_id or organization_name must be provided',
        path: ['organization_id'],
    });

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
