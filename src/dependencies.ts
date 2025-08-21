import {
    createApp,
    MorganFormat,
    createSingleton,
    createFactory,
    setupGracefulShutdown,
    HttpStatusCode,
} from '@vspl/core';
import { Config, SERVICE_NAME } from './config/config';
import rateLimit from 'express-rate-limit';
import { close as closeDb } from './db/db';
import { RATE_LIMIT, TIMEOUTS, MESSAGES } from './constants/app.constants';
import { OrganizationService } from './services/organization.service';
import { SetupCodeService } from './services/setup-code.service';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { RoleService } from './services/role.service';
import { RoleAssignmentService } from './services/role-assignment.service';
import { OrganizationController } from './api/controllers/organization.controller';
import { SetupCodeController } from './api/controllers/setup-code.controller';
import { UserController } from './api/controllers/user.controller';
import { AuthController } from './api/controllers/auth.controller';
import { registerRoutes } from './api/routes';
import { EmailService } from './services/email.service';
import logger from './utils/logger';

// Singleton: Email Service
export const emailService = createSingleton(() => new EmailService());

// Factory: Services
export const organizationService = createFactory(() => new OrganizationService());
export const setupCodeService = createFactory(() => new SetupCodeService(organizationService()));
export const userService = createFactory(() => new UserService());
export const authService = createFactory(() => new AuthService(userService(), emailService()));
export const roleService = createFactory(() => new RoleService());
export const roleAssignmentService = createFactory(() => new RoleAssignmentService());

// Factory: Controllers
export const organizationController = createFactory(
    () => new OrganizationController(organizationService(), roleService()),
);

export const setupCodeController = createFactory(() => new SetupCodeController(setupCodeService()));

export const userController = createFactory(() => new UserController(userService()));

export const authController = createFactory(() => new AuthController(authService()));

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.MAX_REQUESTS,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: MESSAGES.RATE_LIMIT_EXCEEDED,
});

// Create Express app with standard middleware
export const app = createApp({
    name: SERVICE_NAME,
    morganFormat: MorganFormat.DEV,
    errorHandlerOptions: {
        includeStackTrace: Config.SHOW_ERROR_STACK,
    },
    middleware: [limiter],
});

// Add custom routes
app.get('/health', (req, res) => {
    res.status(HttpStatusCode.OK).json({
        success: true,
        timestamp: new Date().toISOString(),
        service: SERVICE_NAME,
        status: 'UP',
        version: process.env.npm_package_version || '1.0.0',
    });
});

app.get('/ping', (req, res) => {
    res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'pong',
        timestamp: new Date().toISOString(),
    });
});

// Register API routes
registerRoutes(
    app,
    organizationController(),
    setupCodeController(),
    userController(),
    authController(),
);

// Setup graceful shutdown
export const setupShutdown = (server: any) => {
    return setupGracefulShutdown(
        [
            // Close HTTP server
            async () => {
                server.close();
                logger.info('HTTP server closed');
            },
            // Close database connections
            async () => {
                await closeDb();
                logger.info('Database connections closed');
            },
        ],
        {
            timeout: TIMEOUTS.GRACEFUL_SHUTDOWN_TIMEOUT_MS,
            logger,
            signals: ['SIGINT', 'SIGTERM'],
            exit: true,
            exitCode: 0,
        },
    );
};
