import { createApp, createDbPool, createHttpClient, logger, HttpClient } from '@vspl/core';
import { createContainer, registerService } from '@vspl/core';
import { getConfig } from '../config/config';
import { Pool } from 'pg';
import { Express } from 'express';
import { IdentityConfig } from '../config/config';
import { SERVICE_NAMES } from './service-names';

// Services
import { DatabaseService } from '../services/database.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/email.service';
import { OrganizationService } from '../services/organization.service';
import { SetupCodeService } from '../services/setup-code.service';
import { RoleService } from '../services/role.service';
import { RoleAssignmentService } from '../services/role-assignment.service';

// Controllers
import { UserController } from '../api/controllers/user.controller';
import { AuthController } from '../api/controllers/auth.controller';
import { OrganizationController } from '../api/controllers/organization.controller';
import { SetupCodeController } from '../api/controllers/setup-code.controller';
import { RoleController } from '../api/controllers/role.controller';

// Middleware and routes
import { registerRoutes } from '../api/routes';
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT, MESSAGES } from '../constants/app.constants';

/**
 * Application dependency container for Identity Service
 */
export const appContainer = createContainer();

/**
 * Initialize all application dependencies
 */
export async function initializeContainer(): Promise<void> {
    logger.info('Initializing Identity Service dependencies...');

    // 1. Core Infrastructure
    appContainer.register(SERVICE_NAMES.CONFIG, async (): Promise<IdentityConfig> => {
        logger.debug('Loading configuration...');
        return await getConfig();
    });

    appContainer.register(
        SERVICE_NAMES.DB_POOL,
        async (): Promise<Pool> => {
            logger.debug('Creating database pool...');
            const config = await appContainer.getAsync<IdentityConfig>(SERVICE_NAMES.CONFIG);
            return createDbPool(config);
        },
        { dependencies: [SERVICE_NAMES.CONFIG] },
    );

    appContainer.register(SERVICE_NAMES.HTTP_CLIENT, () => {
        logger.debug('Creating HTTP client...');
        return createHttpClient({
            baseUrl: '', // Default empty base URL
            timeout: 10000,
        });
    });

    // 2. Database Service
    registerService(appContainer, SERVICE_NAMES.DATABASE_SERVICE, DatabaseService, [
        SERVICE_NAMES.DB_POOL,
    ]);

    // 3. Core Services
    appContainer.register(
        SERVICE_NAMES.USER_SERVICE,
        () => {
            const database = appContainer.get<DatabaseService>(SERVICE_NAMES.DATABASE_SERVICE);
            return new UserService(database);
        },
        { dependencies: [SERVICE_NAMES.DATABASE_SERVICE] },
    );
    appContainer.register(
        SERVICE_NAMES.ROLE_SERVICE,
        () => {
            return new RoleService();
        },
        { dependencies: [] },
    );
    appContainer.register(
        SERVICE_NAMES.ORGANIZATION_SERVICE,
        () => {
            const database = appContainer.get<DatabaseService>(SERVICE_NAMES.DATABASE_SERVICE);
            return new OrganizationService(database);
        },
        { dependencies: [SERVICE_NAMES.DATABASE_SERVICE] },
    );

    // 4. Composite Services (depend on other services)
    appContainer.register(
        SERVICE_NAMES.SETUP_CODE_SERVICE,
        () => {
            const organizationService = appContainer.get<OrganizationService>(
                SERVICE_NAMES.ORGANIZATION_SERVICE,
            );
            return new SetupCodeService(organizationService);
        },
        { dependencies: [SERVICE_NAMES.ORGANIZATION_SERVICE] },
    );
    appContainer.register(
        SERVICE_NAMES.ROLE_ASSIGNMENT_SERVICE,
        () => {
            return new RoleAssignmentService();
        },
        { dependencies: [] },
    );

    // 5. Email Service (lazy - created on demand)
    appContainer.register(
        SERVICE_NAMES.EMAIL_SERVICE,
        () => {
            const config = appContainer.get<IdentityConfig>(SERVICE_NAMES.CONFIG);
            return new EmailService(config);
        },
        { dependencies: [SERVICE_NAMES.CONFIG], lazy: true },
    );

    // 6. Auth Service (depends on user and email services)
    appContainer.register(
        SERVICE_NAMES.AUTH_SERVICE,
        () => {
            const userService = appContainer.get<UserService>(SERVICE_NAMES.USER_SERVICE);
            const emailService = appContainer.get<EmailService>(SERVICE_NAMES.EMAIL_SERVICE);
            const httpClient = appContainer.get<HttpClient>(SERVICE_NAMES.HTTP_CLIENT);
            const config = appContainer.get<IdentityConfig>(SERVICE_NAMES.CONFIG);
            return new AuthService(userService, emailService, httpClient, config);
        },
        {
            dependencies: [
                SERVICE_NAMES.USER_SERVICE,
                SERVICE_NAMES.EMAIL_SERVICE,
                SERVICE_NAMES.HTTP_CLIENT,
                SERVICE_NAMES.CONFIG,
            ],
        },
    );

    // 7. Controllers
    appContainer.register(
        SERVICE_NAMES.USER_CONTROLLER,
        () => {
            const userService = appContainer.get<UserService>(SERVICE_NAMES.USER_SERVICE);
            return new UserController(userService);
        },
        { dependencies: [SERVICE_NAMES.USER_SERVICE] },
    );
    appContainer.register(
        SERVICE_NAMES.AUTH_CONTROLLER,
        () => {
            const authService = appContainer.get<AuthService>(SERVICE_NAMES.AUTH_SERVICE);
            const config = appContainer.get<IdentityConfig>(SERVICE_NAMES.CONFIG);
            return new AuthController(authService, config);
        },
        { dependencies: [SERVICE_NAMES.AUTH_SERVICE, SERVICE_NAMES.CONFIG] },
    );
    appContainer.register(
        SERVICE_NAMES.ORGANIZATION_CONTROLLER,
        () => {
            const organizationService = appContainer.get<OrganizationService>(
                SERVICE_NAMES.ORGANIZATION_SERVICE,
            );
            const roleService = appContainer.get<RoleService>(SERVICE_NAMES.ROLE_SERVICE);
            return new OrganizationController(organizationService, roleService);
        },
        { dependencies: [SERVICE_NAMES.ORGANIZATION_SERVICE, SERVICE_NAMES.ROLE_SERVICE] },
    );
    appContainer.register(
        SERVICE_NAMES.SETUP_CODE_CONTROLLER,
        () => {
            const setupCodeService = appContainer.get<SetupCodeService>(
                SERVICE_NAMES.SETUP_CODE_SERVICE,
            );
            return new SetupCodeController(setupCodeService);
        },
        { dependencies: [SERVICE_NAMES.SETUP_CODE_SERVICE] },
    );
    appContainer.register(
        SERVICE_NAMES.ROLE_CONTROLLER,
        () => {
            const roleService = appContainer.get<RoleService>(SERVICE_NAMES.ROLE_SERVICE);
            return new RoleController(roleService);
        },
        { dependencies: [SERVICE_NAMES.ROLE_SERVICE] },
    );

    // 8. Express Application
    appContainer.register(SERVICE_NAMES.RATE_LIMITER, () => {
        return rateLimit({
            windowMs: RATE_LIMIT.WINDOW_MS,
            max: RATE_LIMIT.MAX_REQUESTS,
            standardHeaders: true,
            legacyHeaders: false,
            message: MESSAGES.RATE_LIMIT_EXCEEDED,
        });
    });

    appContainer.register(
        SERVICE_NAMES.EXPRESS_APP,
        async (): Promise<Express> => {
            logger.debug('Creating Express application...');
            const config = appContainer.get<IdentityConfig>(SERVICE_NAMES.CONFIG);
            const rateLimiter = appContainer.get(SERVICE_NAMES.RATE_LIMITER);

            // Create Express app with middleware
            const app = createApp({
                name: config.SERVICE_NAME,
                morganFormat: 'dev',
                errorHandlerOptions: {
                    includeStackTrace: config.SHOW_ERROR_STACK,
                },
            });

            // Add rate limiter middleware
            app.use(rateLimiter as any);

            // Health check endpoints
            app.get('/health', (req, res) => {
                res.status(200).json({
                    success: true,
                    timestamp: new Date().toISOString(),
                    service: config.SERVICE_NAME,
                    status: 'UP',
                    version: process.env.npm_package_version || '1.0.0',
                });
            });

            app.get('/ping', (req, res) => {
                res.status(200).json({
                    success: true,
                    message: 'pong',
                    timestamp: new Date().toISOString(),
                });
            });

            // Register API routes
            await registerRoutes(
                app,
                appContainer.get(SERVICE_NAMES.ORGANIZATION_CONTROLLER),
                appContainer.get(SERVICE_NAMES.SETUP_CODE_CONTROLLER),
                appContainer.get(SERVICE_NAMES.USER_CONTROLLER),
                appContainer.get(SERVICE_NAMES.AUTH_CONTROLLER),
                appContainer.get(SERVICE_NAMES.ROLE_CONTROLLER),
                config.API_PREFIX,
            );

            logger.debug('Express application configured');
            return app;
        },
        {
            dependencies: [
                SERVICE_NAMES.CONFIG,
                SERVICE_NAMES.RATE_LIMITER,
                SERVICE_NAMES.ORGANIZATION_CONTROLLER,
                SERVICE_NAMES.SETUP_CODE_CONTROLLER,
                SERVICE_NAMES.USER_CONTROLLER,
                SERVICE_NAMES.AUTH_CONTROLLER,
                SERVICE_NAMES.ROLE_CONTROLLER,
            ],
        },
    );

    // Initialize all non-lazy dependencies
    await appContainer.initialize();

    logger.info('Identity Service dependencies initialized successfully');
}

/**
 * Get a dependency from the container
 */
export function getDependency<T>(name: string): T {
    return appContainer.get<T>(name);
}

/**
 * Get a dependency asynchronously (useful for lazy dependencies)
 */
export async function getDependencyAsync<T>(name: string): Promise<T> {
    return appContainer.getAsync<T>(name);
}

/**
 * Check if container is ready
 */
export function isContainerReady(): boolean {
    return appContainer.isInitialized();
}

/**
 * Get all registered dependency names (useful for debugging)
 */
export function getRegisteredDependencies(): string[] {
    return appContainer.getRegisteredNames();
}
