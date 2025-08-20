import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { HttpError, HttpStatusCode } from '@vspl/core';

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
            if (error instanceof z.ZodError) {
                // Format validation errors
                const formattedErrors = error.errors.reduce(
                    (acc, err) => {
                        const path = err.path.join('.');
                        acc[path] = err.message;
                        return acc;
                    },
                    {} as Record<string, string>,
                );

                next(
                    new HttpError(
                        HttpStatusCode.BAD_REQUEST, 
                        'Validation error', 
                        'VALIDATION_ERROR',
                        { errors: formattedErrors }
                    )
                );
            } else {
                next(error);
            }
        }
    };
};

// Export for backwards compatibility
export const validateRequest = validateRequestMiddleware;
