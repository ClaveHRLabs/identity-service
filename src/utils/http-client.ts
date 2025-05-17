import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from './logger';

/**
 * Send an HTTP request with optional setup code in headers
 * 
 * @param config Axios request configuration
 * @param setupCode Optional setup code to include in headers
 * @returns Axios response
 */
export async function sendRequest<T = any>(
    config: AxiosRequestConfig,
    setupCode?: string
): Promise<AxiosResponse<T>> {
    try {
        // Create headers object if it doesn't exist
        if (!config.headers) {
            config.headers = {};
        }

        // Add setup code to headers if provided
        if (setupCode) {
            config.headers['x-setup-code'] = setupCode;
            logger.debug('Added setup code to outgoing request', {
                url: config.url,
                method: config.method
            });
        }

        // Send the request
        return await axios(config);
    } catch (error) {
        logger.error('HTTP request failed', {
            url: config.url,
            method: config.method,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
} 