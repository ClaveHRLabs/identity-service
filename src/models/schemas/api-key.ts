import { z } from 'zod';

// API Key schema
export const ApiKeySchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    name: z.string().min(1, 'API key name is required').max(100),
    description: z.string().max(500).optional(),
    key: z.string().min(37, 'Key must be 37 characters').max(37), // Format: xapi-{32 chars}
    is_active: z.boolean().default(true),
    expires_at: z.date().optional(), // NULL means never expires
    last_used_at: z.date().optional(),
    last_used_ip: z.string().optional(),
    usage_count: z.number().int().min(0).default(0),
    rate_limit_per_minute: z.number().int().min(0).optional(), // Optional rate limiting
    allowed_ips: z.array(z.string()).optional(), // IP whitelist
    metadata: z.record(z.any()).optional(),
    created_at: z.date(),
    updated_at: z.date(),
});

// Schema for creating API keys
export const CreateApiKeySchema = z.object({
    name: z.string().min(1, 'API key name is required').max(100),
    description: z.string().max(500).optional(),
    expires_at: z
        .string()
        .datetime('Invalid date format')
        .transform((str) => new Date(str))
        .optional(), // NULL means never expires
    rate_limit_per_minute: z.number().int().min(1).max(1000).optional(),
    allowed_ips: z.array(z.string().ip()).optional(),
    metadata: z.record(z.any()).optional(),
});

// Schema for updating API keys
export const UpdateApiKeySchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    is_active: z.boolean().optional(),
    expires_at: z
        .string()
        .datetime('Invalid date format')
        .transform((str) => new Date(str))
        .optional(), // NULL means never expires
    rate_limit_per_minute: z.number().int().min(1).max(1000).optional(),
    allowed_ips: z.array(z.string().ip()).optional(),
    metadata: z.record(z.any()).optional(),
});

// Schema for API key authentication
export const ApiKeyAuthSchema = z.object({
    api_key: z
        .string()
        .min(1, 'API key is required')
        .regex(/^xapi-[a-f0-9]{32}$/, 'Invalid API key format'),
});

// Schema for regenerating API key
export const RegenerateApiKeySchema = z.object({
    name: z.string().min(1).max(100).optional(), // Optional rename during regeneration
});

// Type exports
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type CreateApiKey = z.infer<typeof CreateApiKeySchema>;
export type UpdateApiKey = z.infer<typeof UpdateApiKeySchema>;
export type ApiKeyAuth = z.infer<typeof ApiKeyAuthSchema>;
export type RegenerateApiKey = z.infer<typeof RegenerateApiKeySchema>;

// Response types for API key operations
export interface ApiKeyCreatedResponse {
    api_key: {
        id: string;
        name: string;
        description?: string;
        key: string; // Full API key returned only once
        expires_at?: Date;
        created_at: Date;
    };
}

export interface ApiKeyListResponse {
    id: string;
    name: string;
    description?: string;
    key: string; // Show full key for management
    is_active: boolean;
    expires_at?: Date;
    last_used_at?: Date;
    usage_count: number;
    created_at: Date;
}

export interface ApiKeyAuthResponse {
    user: {
        id: string;
        email: string;
        first_name?: string;
        last_name?: string;
        organization_id?: string;
        roles?: string[];
    };
    tokens: {
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    };
    api_key_info: {
        id: string;
        name: string;
        last_used_at: string;
    };
}
