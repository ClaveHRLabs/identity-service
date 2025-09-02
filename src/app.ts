import { logger, setupGracefulShutdown, closePool, createErrorHandler } from '@vspl/core';
import { initializeContainer, getDependency, SERVICE_NAMES } from './di';
import { Express } from 'express';
import { Pool } from 'pg';
import { IdentityConfig } from './config/config';

// Start the server
async function startServer() {
    try {
        // Initialize dependency container
        logger.info('Starting Identity Service...');
        await initializeContainer();

        // Get dependencies from container
        const config = getDependency<IdentityConfig>(SERVICE_NAMES.CONFIG);
        const app = getDependency<Express>(SERVICE_NAMES.EXPRESS_APP);
        const dbPool = getDependency<Pool>(SERVICE_NAMES.DB_POOL);

        // setup the error controller
        app.use(
            createErrorHandler({
                includeStackTrace: config.SHOW_ERROR_STACK,
            }),
        );

        // Start server
        const server = app.listen(config.PORT, () => {
            logger.info(`${config.SERVICE_NAME} started successfully`, {
                port: config.PORT,
                host: config.HOST || 'localhost',
                environment: config.NODE_ENV,
            });
        });

        // Setup graceful shutdown handling
        setupGracefulShutdown(
            [
                async () => {
                    server.close();
                    logger.info('HTTP server closed');
                },
                async () => {
                    await closePool(dbPool);
                    logger.info('Database connections closed');
                },
            ],
            {
                timeout: 10000,
                logger,
                signals: ['SIGINT', 'SIGTERM'],
                exit: true,
                exitCode: 0,
            },
        );
    } catch (error) {
        logger.error('Failed to start server:', { error });
        process.exit(1);
    }
}

// Start the application
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', {
        promise,
        reason: reason instanceof Error ? reason.message : reason,
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
});
