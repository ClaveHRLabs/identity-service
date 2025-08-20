import { app, setupShutdown } from './dependencies';
import { PORT, IS_DEVELOPMENT, SERVICE_NAME } from './config/config';
import logger from './utils/logger';

// Start the server
const server = app.listen(PORT, () => {
    logger.info(`${SERVICE_NAME} running on port ${PORT}`, {
        port: PORT,
        environment: IS_DEVELOPMENT ? 'development' : 'production',
    });
});

// Setup graceful shutdown handling
setupShutdown(server);

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
