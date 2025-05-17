import { z } from 'zod';

// Common validation patterns and error messages
const patterns = {
    email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
};

const messages = {
    required: 'This field is required',
    email: 'Invalid email address',
    invalidUrl: 'Invalid URL format',
};

// User schema
export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(messages.email),
    first_name: z.string().min(1).optional(),
    last_name: z.string().min(1).optional(),
    display_name: z.string().min(1).optional(),
    avatar_url: z.string().url(messages.invalidUrl).optional(),
    email_verified: z.boolean().default(false),
    status: z.enum(['active', 'inactive', 'suspended']).default('active'),
    organization_id: z.string().uuid().optional(),
    metadata: z.record(z.any()).optional(),
    preferences: z.record(z.any()).optional(),
    last_login_at: z.date().optional(),
    created_at: z.date(),
    updated_at: z.date(),
});

// Auth provider schema
export const AuthProviderSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    provider_type: z.enum(['google', 'microsoft', 'email']),
    provider_user_id: z.string().optional(),
    email: z.string().email(messages.email),
    access_token: z.string().optional(),
    refresh_token: z.string().optional(),
    token_expires_at: z.date().optional(),
    metadata: z.record(z.any()).optional(),
    created_at: z.date(),
    updated_at: z.date(),
});

// Magic link schema
export const MagicLinkSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(messages.email),
    token: z.string().min(20),
    expires_at: z.date(),
    used: z.boolean().default(false),
    used_at: z.date().optional(),
    created_at: z.date(),
    metadata: z.record(z.any()).optional(),
});

// Refresh token schema
export const RefreshTokenSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    token: z.string().min(20),
    expires_at: z.date(),
    revoked: z.boolean().default(false),
    created_at: z.date(),
    updated_at: z.date(),
    device_info: z.record(z.any()).optional(),
});

// Schemas for creating entities
export const CreateUserSchema = z.object({
    email: z.string().email(messages.email),
    first_name: z.string().min(1).optional(),
    last_name: z.string().min(1).optional(),
    display_name: z.string().min(1).optional(),
    avatar_url: z.string().url(messages.invalidUrl).optional(),
    organization_id: z.string().uuid().optional(),
    metadata: z.record(z.any()).optional(),
    preferences: z.record(z.any()).optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export const CreateAuthProviderSchema = z.object({
    user_id: z.string().uuid(),
    provider_type: z.enum(['google', 'microsoft', 'email']),
    provider_user_id: z.string().optional(),
    email: z.string().email(messages.email),
    access_token: z.string().optional(),
    refresh_token: z.string().optional(),
    token_expires_at: z.date().optional(),
    metadata: z.record(z.any()).optional(),
});

export const CreateMagicLinkSchema = z.object({
    email: z.string().email(messages.email),
    expiration_minutes: z.number().positive().default(30),
    metadata: z.record(z.any()).optional(),
});

export const CreateRefreshTokenSchema = z.object({
    user_id: z.string().uuid(),
    expiration_days: z.number().positive().default(7),
    device_info: z.record(z.any()).optional(),
});

// OAuth schemas
export const GoogleAuthSchema = z.object({
    code: z.string(),
    redirect_uri: z.string().url(),
});

export const MicrosoftAuthSchema = z.object({
    code: z.string(),
    redirect_uri: z.string().url(),
});

// Magic Link auth schemas
export const SendMagicLinkSchema = z.object({
    email: z.string().email(messages.email),
    redirect_uri: z.string().url().optional(),
});

export const VerifyMagicLinkSchema = z.object({
    token: z.string(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type AuthProvider = z.infer<typeof AuthProviderSchema>;
export type MagicLink = z.infer<typeof MagicLinkSchema>;
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;

export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type CreateAuthProvider = z.infer<typeof CreateAuthProviderSchema>;
export type CreateMagicLink = z.infer<typeof CreateMagicLinkSchema>;
export type CreateRefreshToken = z.infer<typeof CreateRefreshTokenSchema>;

export type GoogleAuth = z.infer<typeof GoogleAuthSchema>;
export type MicrosoftAuth = z.infer<typeof MicrosoftAuthSchema>;
export type SendMagicLink = z.infer<typeof SendMagicLinkSchema>;
export type VerifyMagicLink = z.infer<typeof VerifyMagicLinkSchema>; 