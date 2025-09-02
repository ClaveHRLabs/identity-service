import { z } from 'zod';
import {
    CreateApiKeySchema,
    UpdateApiKeySchema,
    ApiKeyAuthSchema,
} from '../../models/schemas/api-key';

// Request validators that wrap the schema models
export const CreateApiKeyValidator = z.object({
    body: CreateApiKeySchema,
});

export const UpdateApiKeyValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid API key ID format'),
    }),
    body: UpdateApiKeySchema,
});

export const ApiKeyByIdValidator = z.object({
    params: z.object({
        id: z.string().uuid('Invalid API key ID format'),
    }),
});

export const AuthenticateApiKeyValidator = z.object({
    body: ApiKeyAuthSchema,
});
