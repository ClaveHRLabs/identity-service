// Import required modules
import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { registerRoutes } from './api/routes';
import { errorHandler } from './api/middlewares/error-handler';
import { requestIdMiddleware } from './api/middlewares/request-id';
import { responseFormatter } from './api/middlewares/response-formatter';
import { Config } from './config/config';
import { OrganizationController } from './api/controllers/organization.controller';
import { SetupCodeController } from './api/controllers/setup-code.controller';
import { UserController } from './api/controllers/user.controller';
import { AuthController } from './api/controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { OrganizationService } from './services/organization.service';
import { SetupCodeService } from './services/setup-code.service';
import { UserService } from './services/user.service';
import { EmailService } from './services/email.service';

export const createApp = (): Express => {
    // Validate critical configuration
    validateConfiguration();

    // Create express app
    const app = express();

    // Initialize services in dependency order
    const emailService = new EmailService();
    const userService = new UserService();
    const organizationService = new OrganizationService();
    const setupCodeService = new SetupCodeService(organizationService);
    const authService = new AuthService(userService, emailService);

    // Initialize controllers
    const organizationController = new OrganizationController(organizationService);
    const setupCodeController = new SetupCodeController(setupCodeService);
    const userController = new UserController(userService);
    const authController = new AuthController(authService);

    // Apply middlewares
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(morgan('common'));
    app.use(requestIdMiddleware);
    app.use(responseFormatter);

    // Setup routes
    registerRoutes(
        app,
        organizationController,
        setupCodeController,
        userController,
        authController
    );

    // Apply error handler
    app.use(errorHandler);

    return app;
};

function validateConfiguration(): void {
    // Validate required configuration values
    Config.getRequired('JWT_SECRET');
    Config.getRequired('JWT_REFRESH_SECRET');
    Config.getRequired('ADMIN_KEY');
    Config.getRequired('DB_NAME');
    Config.getRequired('DB_USER');
    Config.getRequired('DB_PASS');
} 