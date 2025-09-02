import { Router } from '@vspl/core';
import { ApiKeyController } from '../controllers/api-key.controller';
import { validateRequest } from '../middlewares/validate-request';
import { authenticate } from '../middlewares/authenticate';
import {
    CreateApiKeySchema,
    UpdateApiKeySchema,
    ApiKeyAuthSchema,
} from '../../models/schemas/api-key';

export function createApiKeyRoutes(apiKeyController: ApiKeyController): Router {
    const router = Router();

    // All API key management routes require authentication
    router.use(authenticate);

    /**
     * @route POST /api-keys
     * @desc Create a new API key
     * @access Private
     */
    router.post(
        '/',
        validateRequest(CreateApiKeySchema),
        apiKeyController.createApiKey.bind(apiKeyController),
    );

    /**
     * @route GET /api-keys
     * @desc Get all API keys for the authenticated user
     * @access Private
     */
    router.get('/', apiKeyController.getUserApiKeys.bind(apiKeyController));

    /**
     * @route GET /api-keys/stats
     * @desc Get API key statistics for the authenticated user
     * @access Private
     */
    router.get('/stats', apiKeyController.getApiKeyStats.bind(apiKeyController));

    /**
     * @route GET /api-keys/:id
     * @desc Get API key details by ID
     * @access Private
     */
    router.get('/:id', apiKeyController.getApiKey.bind(apiKeyController));

    /**
     * @route PUT /api-keys/:id
     * @desc Update API key
     * @access Private
     */
    router.put(
        '/:id',
        validateRequest(UpdateApiKeySchema),
        apiKeyController.updateApiKey.bind(apiKeyController),
    );

    /**
     * @route DELETE /api-keys/:id
     * @desc Deactivate API key
     * @access Private
     */
    router.delete('/:id', apiKeyController.deleteApiKey.bind(apiKeyController));

    /**
     * @route POST /api-keys/:id/regenerate
     * @desc Regenerate API key (create new key, deactivate old one)
     * @access Private
     */
    router.post('/:id/regenerate', apiKeyController.createApiKey.bind(apiKeyController));

    /**
     * @route POST /api-keys/authenticate
     * @desc Authenticate with API key and get tokens
     * @access Public
     */
    router.post(
        '/authenticate',
        validateRequest(ApiKeyAuthSchema),
        apiKeyController.authenticateWithApiKey.bind(apiKeyController),
    );

    return router;
}
