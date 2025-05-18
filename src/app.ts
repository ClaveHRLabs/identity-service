// Import required modules
import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { createApiRouter } from './api/routes';
import { errorHandler } from './api/middlewares/error-handler';
import { requestIdMiddleware } from './api/middlewares/request-id';
import { Config } from './config/config';
import { logger } from './utils/logger';

export const createApp = (): Express => {
    // Validate critical configuration
    validateConfiguration();

    // Create express app
    const app = express();

    // Apply middlewares
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(morgan('common'));
    app.use(requestIdMiddleware());

    // Setup routes
    const apiRouter = createApiRouter();
    app.use(Config.API_PREFIX, apiRouter);

    // Apply error handler
    app.use(errorHandler);

    return app;
};

// Function to validate critical configuration
function validateConfiguration() {
    // Check JWT configuration
    if (!Config.JWT_SECRET || !Config.JWT_REFRESH_SECRET) {
        logger.error('JWT_SECRET and JWT_REFRESH_SECRET must be set');
        process.exit(1);
    }

    // Check OAuth providers
    if (Config.LINKEDIN_CLIENT_ID && !Config.LINKEDIN_CLIENT_SECRET) {
        logger.warn('LinkedIn OAuth configuration incomplete: LINKEDIN_CLIENT_SECRET missing');
    }

    if (!Config.LINKEDIN_CLIENT_ID && Config.LINKEDIN_CLIENT_SECRET) {
        logger.warn('LinkedIn OAuth configuration incomplete: LINKEDIN_CLIENT_ID missing');
    }

    if (Config.LINKEDIN_CLIENT_ID && Config.LINKEDIN_CLIENT_SECRET) {
        logger.info('LinkedIn OAuth configuration detected', {
            clientIdLength: Config.LINKEDIN_CLIENT_ID.length,
            clientSecretLength: Config.LINKEDIN_CLIENT_SECRET.length
        });
    }

    // Similar checks for other providers
    ['GOOGLE', 'MICROSOFT'].forEach(provider => {
        const clientId = Config[`${provider}_CLIENT_ID`];
        const clientSecret = Config[`${provider}_CLIENT_SECRET`];

        if (clientId && !clientSecret) {
            logger.warn(`${provider} OAuth configuration incomplete: ${provider}_CLIENT_SECRET missing`);
        }

        if (!clientId && clientSecret) {
            logger.warn(`${provider} OAuth configuration incomplete: ${provider}_CLIENT_ID missing`);
        }

        if (clientId && clientSecret) {
            logger.info(`${provider} OAuth configuration detected`);
        }
    });
} 