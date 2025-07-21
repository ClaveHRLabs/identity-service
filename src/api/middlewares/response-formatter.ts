import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to standardize API responses across services
 * Response format: {
 *   timestamp: string (UTC),
 *   requestId: string,
 *   success: boolean,
 *   message: string (optional),
 *   error: {
 *     type: string,
 *     message: string
 *   } (optional, when success is false),
 *   data: any (optional, when success is true)
 * }
 */
export const responseFormatter = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Store original json method
    const originalJson = res.json;

    // Override json method
    res.json = function (body: any): Response {
        // Check if body already follows the standard format
        if (body && typeof body === 'object' && 'success' in body && 'timestamp' in body) {
            // Already formatted, just ensure requestId
            if (!(req as any).requestId) {
                body.requestId = 'unknown';
            } else if (!body.requestId) {
                body.requestId = (req as any).requestId;
            }
            return originalJson.call(this, body);
        }

        // Create standard response format
        const standardResponse = {
            timestamp: new Date().toISOString(), // UTC timestamp
            requestId: (req as any).requestId || 'unknown',
            success: res.statusCode < 400,
            message: '',
            error: undefined as { type: string; message: string } | undefined,
            data: undefined as any | undefined,
        };

        // Handle success case
        if (res.statusCode < 400) {
            if (body && typeof body === 'object') {
                // Extract message if present
                if (body.message) {
                    standardResponse.message = body.message;
                    delete body.message;
                }

                // If body has a data property, use it, otherwise treat entire body as data
                if ('data' in body) {
                    standardResponse.data = body.data;
                } else if (Object.keys(body).length > 0) {
                    // Skip forwarding 'success' property
                    if ('success' in body && Object.keys(body).length === 1) {
                        standardResponse.data = undefined;
                    } else {
                        const { success, ...rest } = body;
                        standardResponse.data = Object.keys(rest).length > 0 ? rest : undefined;
                    }
                }
            } else {
                // For non-object body, use it as data directly
                standardResponse.data = body !== undefined ? body : null;
            }
        }
        // Handle error case
        else {
            if (body && typeof body === 'object') {
                // Extract error information
                if (body.message) {
                    standardResponse.message = body.message;
                }

                if (body.error) {
                    standardResponse.error = {
                        type: body.error.code || 'ERROR',
                        message: body.error.message || standardResponse.message || 'An error occurred'
                    } as { type: string; message: string };
                } else {
                    standardResponse.error = {
                        type: 'ERROR',
                        message: standardResponse.message || 'An error occurred'
                    } as { type: string; message: string };
                }
            } else {
                standardResponse.error = {
                    type: 'ERROR',
                    message: typeof body === 'string' ? body : 'An error occurred'
                } as { type: string; message: string };
            }

            // Set generic message if not already set
            if (!standardResponse.message) {
                standardResponse.message = standardResponse.error?.message || 'An error occurred';
            }
        }

        // Return with formatted response
        return originalJson.call(this, standardResponse);
    };

    next();
}; 