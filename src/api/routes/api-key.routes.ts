import { Router } from '@vspl/core';
import { ApiKeyController } from '../controllers/api-key.controller';
import { validateRequest } from '../middlewares/validate-request';
import { authenticate } from '../middlewares/authenticate';
import {
    CreateApiKeyValidator,
    UpdateApiKeyValidator,
    ApiKeyByIdValidator,
    AuthenticateApiKeyValidator,
} from '../validators/api-key.validator';

export function createApiKeyRoutes(apiKeyController: ApiKeyController): Router {
    const router = Router();

    /**
     * @route POST /api-keys/authenticate
     * @desc Authenticate with API key and get tokens
     * @access Public (no authentication required)
     */
    router.post(
        '/authenticate',
        validateRequest(AuthenticateApiKeyValidator),
        apiKeyController.authenticateWithApiKey.bind(apiKeyController),
    );

    // All other API key management routes require authentication
    router.use(authenticate);

    /**
     * @route POST /api-keys
     * @desc Create a new API key
     * @access Private
     */
    router.post(
        '/',
        validateRequest(CreateApiKeyValidator),
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
    router.get(
        '/:id',
        validateRequest(ApiKeyByIdValidator),
        apiKeyController.getApiKey.bind(apiKeyController),
    );

    /**
     * @route PUT /api-keys/:id
     * @desc Update API key
     * @access Private
     */
    router.put(
        '/:id',
        validateRequest(UpdateApiKeyValidator),
        apiKeyController.updateApiKey.bind(apiKeyController),
    );

    /**
     * @route DELETE /api-keys/:id
     * @desc Deactivate API key
     * @access Private
     */
    router.delete(
        '/:id',
        validateRequest(ApiKeyByIdValidator),
        apiKeyController.deleteApiKey.bind(apiKeyController),
    );

    return router;
}
