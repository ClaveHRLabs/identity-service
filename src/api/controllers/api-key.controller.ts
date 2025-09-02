import { CatchErrors, createLogger, HttpStatusCode, Measure, Request, Response } from '@vspl/core';

import { ApiKeyService } from '../../services/api-key.service';
import { CreateApiKey, UpdateApiKey } from '../../models/schemas/api-key';

const logger = createLogger();

export class ApiKeyController {
    constructor(private readonly apiKeyService: ApiKeyService) {}

    /**
     * Create a new API key for the authenticated user
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'createApiKey', logLevel: 'info' })
    async createApiKey(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(HttpStatusCode.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }

        const createData: CreateApiKey = req.body;
        const result = await this.apiKeyService.createApiKey(userId, createData);

        logger.info('API key created successfully', { userId, apiKeyId: result.api_key.id });

        res.status(HttpStatusCode.CREATED).json({
            success: true,
            data: result,
            message: 'API key created successfully',
        });
    }

    /**
     * Get all API keys for the authenticated user
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'getUserApiKeys', logLevel: 'info' })
    async getUserApiKeys(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(HttpStatusCode.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }

        const apiKeys = await this.apiKeyService.getApiKeys(userId);

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: apiKeys,
        });
    }

    /**
     * Get a specific API key by ID
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'getApiKey', logLevel: 'info' })
    async getApiKey(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.id;
        const { apiKeyId } = req.params;

        if (!userId) {
            res.status(HttpStatusCode.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }

        const apiKey = await this.apiKeyService.getApiKeyDetails(userId, apiKeyId);

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: apiKey,
        });
    }

    /**
     * Update an API key
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'updateApiKey', logLevel: 'info' })
    async updateApiKey(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.id;
        const { apiKeyId } = req.params;
        const updateData: UpdateApiKey = req.body;

        if (!userId) {
            res.status(HttpStatusCode.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }

        const updatedApiKey = await this.apiKeyService.updateApiKey(userId, apiKeyId, updateData);

        logger.info('API key updated successfully', { userId, apiKeyId });

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: updatedApiKey,
            message: 'API key updated successfully',
        });
    }

    /**
     * Delete (deactivate) an API key
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'deleteApiKey', logLevel: 'info' })
    async deleteApiKey(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.id;
        const { apiKeyId } = req.params;

        if (!userId) {
            res.status(HttpStatusCode.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }

        await this.apiKeyService.deleteApiKey(userId, apiKeyId);

        logger.info('API key deleted successfully', { userId, apiKeyId });

        res.status(HttpStatusCode.OK).json({
            success: true,
            message: 'API key deleted successfully',
        });
    }

    /**
     * Authenticate with API key and generate tokens
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'authenticateWithApiKey', logLevel: 'info' })
    async authenticateWithApiKey(req: Request, res: Response): Promise<void> {
        const { api_key } = req.body;
        const clientIp = req.ip || req.connection.remoteAddress;

        if (!api_key) {
            res.status(HttpStatusCode.BAD_REQUEST).json({
                success: false,
                message: 'API key is required',
            });
            return;
        }

        const authResult = await this.apiKeyService.authenticateWithApiKey(api_key, clientIp);

        logger.info('API key authentication successful', {
            userId: authResult.user.id,
            apiKeyId: authResult.api_key_info.id,
        });

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: authResult,
            message: 'Authentication successful',
        });
    }

    /**
     * Get API key statistics for the authenticated user
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'getApiKeyStats', logLevel: 'info' })
    async getApiKeyStats(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(HttpStatusCode.UNAUTHORIZED).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }

        const stats = await this.apiKeyService.getApiKeyStats(userId);

        res.status(HttpStatusCode.OK).json({
            success: true,
            data: stats,
        });
    }
}
