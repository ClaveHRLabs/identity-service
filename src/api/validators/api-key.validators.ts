import { z } from 'zod';

// Validation for creating API keys
export const createApiKeyValidator = z.object({
    body: z.object({
        name: z
            .string()
            .min(1, 'API key name is required')
            .max(100, 'API key name must be less than 100 characters')
            .trim(),
        description: z
            .string()
            .max(500, 'Description must be less than 500 characters')
            .trim()
            .optional(),
        expires_at: z
            .string()
            .datetime('Invalid date format')
            .transform((str) => new Date(str))
            .refine((date) => date > new Date(), 'Expiration date must be in the future')
            .optional(),
        rate_limit_per_minute: z
            .number()
            .int('Rate limit must be an integer')
            .min(1, 'Rate limit must be at least 1')
            .max(1000, 'Rate limit cannot exceed 1000 requests per minute')
            .optional(),
        allowed_ips: z
            .array(z.string().ip('Invalid IP address'))
            .max(10, 'Maximum 10 IP addresses allowed')
            .optional(),
        metadata: z.record(z.any()).optional(),
    }),
});

// Validation for updating API keys
export const updateApiKeyValidator = z.object({
    body: z.object({
        name: z
            .string()
            .min(1, 'API key name is required')
            .max(100, 'API key name must be less than 100 characters')
            .trim()
            .optional(),
        description: z
            .string()
            .max(500, 'Description must be less than 500 characters')
            .trim()
            .optional(),
        is_active: z.boolean().optional(),
        expires_at: z
            .string()
            .datetime('Invalid date format')
            .transform((str) => new Date(str))
            .refine((date) => date > new Date(), 'Expiration date must be in the future')
            .optional(),
        rate_limit_per_minute: z
            .number()
            .int('Rate limit must be an integer')
            .min(1, 'Rate limit must be at least 1')
            .max(1000, 'Rate limit cannot exceed 1000 requests per minute')
            .optional(),
        allowed_ips: z
            .array(z.string().ip('Invalid IP address'))
            .max(10, 'Maximum 10 IP addresses allowed')
            .optional(),
        metadata: z.record(z.any()).optional(),
    }),
});

// Validation for API key authentication
export const authenticateApiKeyValidator = z.object({
    body: z.object({
        api_key: z
            .string()
            .min(1, 'API key is required')
            .regex(/^xapi-[a-f0-9]{32}$/, 'Invalid API key format'),
    }),
});

// Validation for API key ID parameter
export const apiKeyIdValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid API key ID format'),
    }),
});

// Combined validators for routes
export const createApiKeyValidation = createApiKeyValidator;
export const updateApiKeyValidation = z.object({
    ...updateApiKeyValidator.shape,
    ...apiKeyIdValidator.shape,
});
export const authenticateApiKeyValidation = authenticateApiKeyValidator;
export const apiKeyByIdValidation = apiKeyIdValidator;
