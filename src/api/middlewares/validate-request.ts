import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './error-handler';

/**
 * Middleware factory that validates a request against a Zod schema
 * @param schema Zod schema to validate against
 */
export const validateRequest = (schema: AnyZodObject) => {
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
            if (error instanceof ZodError) {
                // Format validation errors
                const formattedErrors = error.errors.reduce((acc, err) => {
                    const path = err.path.join('.');
                    acc[path] = err.message;
                    return acc;
                }, {} as Record<string, string>);

                next(new AppError(
                    'Validation error',
                    400,
                    'VALIDATION_ERROR',
                    { errors: formattedErrors }
                ));
            } else {
                next(error);
            }
        }
    };
}; 