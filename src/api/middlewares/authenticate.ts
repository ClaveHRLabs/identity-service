import { authenticate as tokenAuthenticate, optionalAuthenticate, loadUser } from './auth';
import { Request, Response, NextFunction } from 'express';

// Re-export original middlewares
export { optionalAuthenticate, loadUser };

/**
 * Combined authentication middleware that both verifies the token
 * and loads the user object. This is required for RBAC to work properly.
 */
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    // First authenticate the token, then load the user
    tokenAuthenticate(req, res, (error) => {
        if (error) {
            return next(error);
        }

        // After token validation, load the complete user
        loadUser(req, res, next);
    });
};
