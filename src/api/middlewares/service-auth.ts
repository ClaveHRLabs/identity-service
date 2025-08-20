import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';
import { SERVICE_API_KEY } from '../../config/config';
import { HttpError, HttpStatusCode } from '@vspl/core';
import { AuthHeader } from '../../constants/app.constants';
import * as userRepository from '../../db/user';
import * as roleRepository from '../../db/role';
import { Role, Permission } from '../../models/schemas/role';

/**
 * Middleware for authenticating service-to-service requests
 * This allows services to act on behalf of users using secure service keys
 */
export const serviceAuthMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        // First, check if it's a service request by verifying the service key header exists
        const serviceKey = req.headers[AuthHeader.SERVICE_KEY];
        if (!serviceKey) {
            // No service key provided, continue with regular auth flow
            return next();
        }

        // If SERVICE_API_KEY is configured, validate it
        // If not configured, skip validation (useful for development)
        if (SERVICE_API_KEY && SERVICE_API_KEY !== serviceKey) {
            logger.warn('Invalid service API key', {
                path: req.path,
                method: req.method,
            });
            return next(new HttpError(HttpStatusCode.UNAUTHORIZED, 'Invalid service API key'));
        }

        logger.debug('Service authentication successful', {
            path: req.path,
            method: req.method,
        });

        // Process all the headers and set up the request properly
        // This will effectively bypass token authentication for service requests
        (req as any).isServiceRequest = true; // Mark as service request

        // Check if we have user context passed from another service
                        const userId = req.headers[AuthHeader.USER_ID];
        if (userId && typeof userId === 'string') {
            // Set the user ID on the request
            req.userId = userId;

            try {
                // Try to load the user from database
                const user = await userRepository.getUserById(userId);
                if (user) {
                    req.user = user;

                    // Add permissions from headers if available
                    const permissions = req.headers[AuthHeader.USER_PERMISSIONS];
                    if (permissions && typeof permissions === 'string') {
                        try {
                            (req as any).permissions = permissions.split(',');
                        } catch {
                            logger.warn('Error parsing permissions from header', { permissions });
                        }
                    } else {
                        // If no permissions in header but roles are available, try to derive permissions
                        const roles = req.headers[AuthHeader.USER_ROLES];
                        if (roles && typeof roles === 'string') {
                            try {
                                const roleNames = roles.split(',');
                                const userRoles = await roleRepository.getRolesByNames(roleNames);

                                // Extract permissions from roles
                                if (userRoles && userRoles.length > 0) {
                                    const userPermissions =
                                        await roleRepository.getPermissionsForRoles(
                                            userRoles.map((role: Role) => role.id),
                                        );

                                    (req as any).permissions = userPermissions.map(
                                        (p: Permission) => p.name,
                                    );
                                }
                            } catch (e) {
                                logger.warn('Error deriving permissions from roles', {
                                    error: e instanceof Error ? e.message : 'Unknown error',
                                    roles,
                                });
                            }
                        }
                    }

                    logger.debug('User loaded from forwarded context', {
                        userId,
                        path: req.path,
                    });
                }
            } catch (error) {
                logger.warn('Error loading user from service context', {
                    userId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                // Continue even if user loading fails - it might be a service-only operation
            }
        }

        // Set organization context if provided
                        const organizationId = req.headers[AuthHeader.ORG_ID];
        if (organizationId && typeof organizationId === 'string') {
            (req as any).organizationId = organizationId;

            if (!req.body.organization_id) {
                req.body.organization_id = organizationId;
            }
        }

        // Skip regular authentication since this is now fully authenticated via service
        return next();
    } catch (error) {
        logger.error('Error in service authentication middleware', {
            error: error instanceof Error ? error.message : 'Unknown error',
            path: req.path,
        });
        next(error);
    }
};

// Alias for backwards compatibility
export const serviceAuth = serviceAuthMiddleware;
