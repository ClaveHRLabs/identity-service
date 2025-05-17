import db from './src/db/db';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { Config } from './src/config/config';
import { errorHandler } from './src/api/middlewares/error-handler';
import { requestIdMiddleware } from './src/api/middlewares/request-id';
import { OrganizationService } from './src/services/organization.service';
import { SetupCodeService } from './src/services/setup-code.service';
import { OrganizationController } from './src/api/controllers/organization.controller';
import { SetupCodeController } from './src/api/controllers/setup-code.controller';
import { registerRoutes } from './src/api/routes';

// Singleton: Database Pool
export const dbPool = db;

// Factory: Services
export const organizationService = new OrganizationService();
export const setupCodeService = new SetupCodeService(organizationService);

// Factory: Controllers
export const organizationController = new OrganizationController(organizationService);
export const setupCodeController = new SetupCodeController(setupCodeService);

/**
 * Create Express App with all middleware
 * Factory pattern for creating the Express application
 */
export const createExpressApp = () => {
    const app = express();

    // Security middlewares
    app.use(helmet());
    app.use(cors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        message: 'Too many requests from this IP, please try again later.',
    });
    app.use(limiter);

    // Request parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Request ID middleware
    app.use(requestIdMiddleware);

    // HTTP request logging - using simple morgan format
    app.use(morgan('combined'));

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            service: Config.SERVICE_NAME,
            status: 'UP',
            version: process.env.npm_package_version || '1.0.0',
        });
    });

    // Ping endpoint
    app.get('/ping', (req, res) => {
        res.status(200).json({
            success: true,
            message: 'pong',
            timestamp: new Date().toISOString(),
        });
    });

    // Register API routes
    registerRoutes(app, organizationController, setupCodeController);

    // Error handling middleware (must be last)
    app.use(errorHandler);

    return app;
};

// Factory: Express App
export const app = createExpressApp(); 