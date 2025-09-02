import { Request, Response, NextFunction, logger, HttpError, HttpStatusCode } from '@vspl/core';
import { ApiKeyService } from '../../services/api-key.service';

/**
 * Middleware to authenticate requests using API keys
 * Extracts API key from Authorization header and validates it
 */
export function createApiKeyAuthMiddleware(apiKeyService: ApiKeyService) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                throw new HttpError(HttpStatusCode.UNAUTHORIZED, 'Authorization header required');
            }

            // Support both "Bearer" and "ApiKey" prefixes
            let apiKey: string;
            if (authHeader.startsWith('Bearer ')) {
                apiKey = authHeader.substring(7);
            } else if (authHeader.startsWith('ApiKey ')) {
                apiKey = authHeader.substring(7);
            } else {
                throw new HttpError(
                    HttpStatusCode.UNAUTHORIZED,
                    'Invalid authorization header format',
                );
            }

            if (!apiKey) {
                throw new HttpError(HttpStatusCode.UNAUTHORIZED, 'API key not provided');
            }

            // Get client IP for tracking and IP whitelist validation
            const clientIp =
                req.ip ||
                req.connection.remoteAddress ||
                (req.headers['x-forwarded-for'] as string) ||
                (req.headers['x-real-ip'] as string);

            // Authenticate with API key
            const authResult = await apiKeyService.authenticateWithApiKey(apiKey, clientIp);

            // Attach user and token information to request
            (req as any).user = authResult.user;
            (req as any).tokens = authResult.tokens;
            (req as any).apiKeyInfo = authResult.api_key_info;
            (req as any).authMethod = 'api_key';

            logger.debug('API key authentication successful', {
                userId: authResult.user.id,
                apiKeyId: authResult.api_key_info.id,
                clientIp,
            });

            next();
        } catch (error) {
            logger.warn('API key authentication failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                clientIp: req.ip,
                userAgent: req.headers['user-agent'],
            });

            if (error instanceof HttpError) {
                res.status(error.status).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: error.code,
                    },
                    timestamp: new Date().toISOString(),
                });
                return;
            }

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: {
                    message: 'Internal server error',
                },
                timestamp: new Date().toISOString(),
            });
        }
    };
}

/**
 * Middleware to optionally authenticate requests using API keys
 * If API key is provided, validates it, otherwise continues without authentication
 */
export function createOptionalApiKeyAuthMiddleware(apiKeyService: ApiKeyService) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            // No auth header, continue without authentication
            next();
            return;
        }

        // If auth header is present, try to authenticate
        const apiKeyAuth = createApiKeyAuthMiddleware(apiKeyService);
        await apiKeyAuth(req, res, next);
    };
}
