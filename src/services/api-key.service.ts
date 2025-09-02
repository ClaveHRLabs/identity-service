import { logger, HttpError, HttpStatusCode } from '@vspl/core';

import * as apiKeyRepository from '../db/api-key';
import * as userRepository from '../db/user';
import { IdentityConfig } from '../config/config';
import {
    CreateApiKey,
    UpdateApiKey,
    ApiKeyCreatedResponse,
    ApiKeyListResponse,
    ApiKeyAuthResponse,
} from '../models/schemas/api-key';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { generateApiKey, isValidApiKeyFormat } from '../utils/api-key';

export class ApiKeyService {
    constructor(private readonly config: IdentityConfig) {}

    /**
     * Create a new API key for a user
     */
    async createApiKey(userId: string, data: CreateApiKey): Promise<ApiKeyCreatedResponse> {
        // Verify user exists
        const user = await userRepository.getUserById(userId);
        if (!user) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'User not found');
        }

        // Check if user already has too many API keys (limit to 10 per user)
        const existingKeys = await apiKeyRepository.getApiKeysByUserId(userId, false);
        if (existingKeys.length >= 10) {
            throw new HttpError(
                HttpStatusCode.BAD_REQUEST,
                'Maximum number of API keys reached (10 per user)',
            );
        }

        // Check for duplicate names for this user
        const duplicateName = existingKeys.find((key) => key.name === data.name);
        if (duplicateName) {
            throw new HttpError(
                HttpStatusCode.CONFLICT,
                'API key name already exists for this user',
            );
        }

        // Generate API key
        const key = generateApiKey();

        // Create API key in database
        const apiKey = await apiKeyRepository.createApiKey({
            ...data,
            user_id: userId,
            key,
        });

        logger.info('API key created successfully', {
            userId,
            apiKeyId: apiKey.id,
            key: apiKey.key.substring(0, 10) + '...',
        });

        return {
            api_key: {
                id: apiKey.id,
                name: apiKey.name,
                description: apiKey.description,
                key: apiKey.key, // Full key returned only once!
                expires_at: apiKey.expires_at,
                created_at: apiKey.created_at,
            },
        };
    }

    /**
     * Get all API keys for a user
     */
    async getApiKeys(userId: string): Promise<ApiKeyListResponse[]> {
        const apiKeys = await apiKeyRepository.getApiKeysByUserId(userId, false);

        return apiKeys.map((apiKey) => ({
            id: apiKey.id,
            name: apiKey.name,
            description: apiKey.description,
            key: apiKey.key,
            is_active: apiKey.is_active,
            expires_at: apiKey.expires_at,
            last_used_at: apiKey.last_used_at,
            usage_count: apiKey.usage_count,
            created_at: apiKey.created_at,
        }));
    }

    /**
     * Get API key details by ID
     */
    async getApiKeyDetails(userId: string, apiKeyId: string): Promise<ApiKeyListResponse | null> {
        const apiKey = await apiKeyRepository.getApiKeyById(apiKeyId);

        if (!apiKey || apiKey.user_id !== userId) {
            return null;
        }

        return {
            id: apiKey.id,
            name: apiKey.name,
            description: apiKey.description,
            key: apiKey.key,
            is_active: apiKey.is_active,
            expires_at: apiKey.expires_at,
            last_used_at: apiKey.last_used_at,
            usage_count: apiKey.usage_count,
            created_at: apiKey.created_at,
        };
    }

    /**
     * Update API key
     */
    async updateApiKey(
        userId: string,
        apiKeyId: string,
        data: UpdateApiKey,
    ): Promise<ApiKeyListResponse | null> {
        // Verify ownership
        const existingKey = await apiKeyRepository.getApiKeyById(apiKeyId);
        if (!existingKey || existingKey.user_id !== userId) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'API key not found');
        }

        // Check for duplicate names if name is being changed
        if (data.name && data.name !== existingKey.name) {
            const existingKeys = await apiKeyRepository.getApiKeysByUserId(userId, true);
            const duplicateName = existingKeys.find(
                (key) => key.name === data.name && key.id !== apiKeyId,
            );
            if (duplicateName) {
                throw new HttpError(
                    HttpStatusCode.CONFLICT,
                    'API key name already exists for this user',
                );
            }
        }

        const updatedKey = await apiKeyRepository.updateApiKey(apiKeyId, data);
        if (!updatedKey) {
            return null;
        }

        logger.info('API key updated successfully', {
            userId,
            apiKeyId,
            key: updatedKey.key.substring(0, 10) + '...',
        });

        return {
            id: updatedKey.id,
            name: updatedKey.name,
            description: updatedKey.description,
            key: updatedKey.key,
            is_active: updatedKey.is_active,
            expires_at: updatedKey.expires_at,
            last_used_at: updatedKey.last_used_at,
            usage_count: updatedKey.usage_count,
            created_at: updatedKey.created_at,
        };
    }

    /**
     * Deactivate API key
     */
    async deactivateApiKey(userId: string, apiKeyId: string): Promise<boolean> {
        // Verify ownership
        const existingKey = await apiKeyRepository.getApiKeyById(apiKeyId);
        if (!existingKey || existingKey.user_id !== userId) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'API key not found');
        }

        const success = await apiKeyRepository.deleteApiKey(apiKeyId);

        if (success) {
            logger.info('API key deactivated successfully', {
                userId,
                apiKeyId,
                key: existingKey.key.substring(0, 10) + '...',
            });
        }

        return success;
    }

    /**
     * Permanently delete API key
     */
    async deleteApiKey(userId: string, apiKeyId: string): Promise<boolean> {
        // Verify ownership
        const existingKey = await apiKeyRepository.getApiKeyById(apiKeyId);
        if (!existingKey || existingKey.user_id !== userId) {
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'API key not found');
        }

        const success = await apiKeyRepository.permanentlyDeleteApiKey(apiKeyId);

        if (success) {
            logger.info('API key permanently deleted', {
                userId,
                apiKeyId,
                key: existingKey.key.substring(0, 10) + '...',
            });
        }

        return success;
    }

    /**
     * Authenticate with API key and generate tokens
     */
    async authenticateWithApiKey(apiKey: string, clientIp?: string): Promise<ApiKeyAuthResponse> {
        // Validate API key format
        if (!isValidApiKeyFormat(apiKey)) {
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, 'Invalid API key format');
        }

        // Get API key from database
        const dbApiKey = await apiKeyRepository.getApiKeyByKey(apiKey);
        if (!dbApiKey || !dbApiKey.is_active) {
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, 'Invalid or inactive API key');
        }

        // Check expiration (already handled in query, but double check)
        if (dbApiKey.expires_at && new Date(dbApiKey.expires_at) <= new Date()) {
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, 'API key has expired');
        }

        // Check IP whitelist if configured
        if (dbApiKey.allowed_ips && dbApiKey.allowed_ips.length > 0 && clientIp) {
            const isIpAllowed = dbApiKey.allowed_ips.some((allowedIp) => {
                // Simple IP matching - can be enhanced with CIDR support
                return allowedIp === clientIp;
            });
            if (!isIpAllowed) {
                throw new HttpError(HttpStatusCode.FORBIDDEN, 'IP address not allowed');
            }
        }

        // Update usage tracking
        await apiKeyRepository.updateApiKeyUsage(apiKey, clientIp);

        // Get full user information for token generation
        const user = await userRepository.getUserById(dbApiKey.user_id);
        if (!user) {
            throw new HttpError(HttpStatusCode.UNAUTHORIZED, 'User not found');
        }

        // Generate tokens with user's permissions (API key inherits user permissions)
        const accessToken = await generateAccessToken(user, this.config);
        const refreshToken = await generateRefreshToken(user, this.config);

        logger.info('API key authentication successful', {
            userId: user.id,
            apiKeyId: dbApiKey.id,
            key: dbApiKey.key.substring(0, 10) + '...',
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                organization_id: user.organization_id,
                roles: [], // Will be populated from JWT token generation
            },
            tokens: {
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'Bearer',
                expires_in: 3600, // 1 hour in seconds
            },
            api_key_info: {
                id: dbApiKey.id,
                name: dbApiKey.name,
                last_used_at: new Date().toISOString(),
            },
        };
    }

    /**
     * Get API key statistics for a user
     */
    async getApiKeyStats(userId: string): Promise<{
        total: number;
        active: number;
        expired: number;
        totalUsage: number;
    }> {
        return await apiKeyRepository.getApiKeyStats(userId);
    }
}
