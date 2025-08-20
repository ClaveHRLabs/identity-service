import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

/**
 * Middleware to add setup code to the response header
 * This is used when a setup code has been validated and needs to be passed to other services
 */
export const addSetupCodeHeader = (req: Request, res: Response, next: NextFunction): void => {
    // Store the original send method
    const originalSend = res.send;

    // Check if we're processing a setup code
    if (req.body.code && req.path.includes('/validate')) {
        // Override the send method
        res.send = function (body: any): Response {
            try {
                // If the response is successful and contains organization data
                if (body && typeof body === 'string') {
                    const parsedBody = JSON.parse(body);
                    if (parsedBody.success && parsedBody.data && parsedBody.data.organization) {
                        // Add the setup code to the response header
                        res.setHeader('x-setup-code', req.body.code);
                        logger.debug('Added setup code to response header', {
                            code: req.body.code,
                        });
                    }
                }
            } catch (error) {
                logger.error('Error adding setup code header', { error });
            }

            // Call the original send method
            return originalSend.call(this, body);
        };
    }

    next();
};

/**
 * Middleware to extract setup code from request header
 * This is used when receiving requests that might contain a setup code
 */
export const extractSetupCode = (req: Request, res: Response, next: NextFunction): void => {
    const setupCode = req.header('x-setup-code');

    if (setupCode) {
        // Add the setup code to the request object for use in controllers
        (req as any).setupCode = setupCode;
        logger.debug('Extracted setup code from request header', { code: setupCode });
    }

    next();
};
