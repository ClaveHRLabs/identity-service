import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '@vspl/core';

/**
 * Middleware factory that validates a request against a Zod schema
 * @param schema Zod schema to validate against
 */
export const validateRequestMiddleware = (schema: z.ZodSchema<any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Parse and validate request (body, query, params)
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            next();
        } catch (error) {
            logger.error('Validation error', { error });
            next(error);
        }
    };
};

// Export for backwards compatibility
export const validateRequest = validateRequestMiddleware;
