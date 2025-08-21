import { createHttpClient } from '@vspl/core';
import { SERVICE_NAME, SERVICE_API_KEY } from '../config/config';
import { TIMEOUTS } from '../constants/app.constants';
import logger from './logger';

/**
 * Create a default HTTP client for service-to-service communication
 */
export const createServiceClient = (baseUrl: string) => {
    return createHttpClient({
        baseUrl,
        apiKey: SERVICE_NAME,
        serviceKey: SERVICE_API_KEY,
        timeout: TIMEOUTS.DEFAULT_HTTP_TIMEOUT_MS,
        headers: {
            'Content-Type': 'application/json',
        },
        logger,
    });
};

/**
 * Send an HTTP request with optional setup code in headers
 * (for backward compatibility with existing code)
 */
export async function sendRequest<T = any>(
    config: any,
    setupCode?: string,
): Promise<T> {
    try {
        // Add setup code to headers if provided
        const requestConfig = { ...config };

        if (setupCode) {
            requestConfig.headers = {
                ...requestConfig.headers,
                'x-setup-code': setupCode,
            };

            logger.debug('Added setup code to outgoing request', {
                url: config.url,
                method: config.method,
            });
        }

        // Create a one-off client for this request
        const client = createHttpClient({
            baseUrl: config.url || '',
            timeout: config.timeout || TIMEOUTS.DEFAULT_HTTP_TIMEOUT_MS,
            logger,
        });

        // Send the request (maintaining the same API signature for backward compatibility)
        const method = (requestConfig.method || 'GET').toLowerCase();
        let response;
        
        switch (method) {
            case 'post':
                response = await client.post('', requestConfig.data, { headers: requestConfig.headers });
                break;
            case 'put':
                response = await client.put('', requestConfig.data, { headers: requestConfig.headers });
                break;
            case 'delete':
                response = await client.delete('', { headers: requestConfig.headers });
                break;
            default:
                response = await client.get('', { headers: requestConfig.headers });
        }
        
        return response;
    } catch (error) {
        logger.error('HTTP request failed', {
            url: config.url,
            method: config.method,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
}
