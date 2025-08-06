import { app, dbPool } from './dependencies';
import { logger } from './utils/logger';

// Start the server
// Use a different port for development mode if the main port is taken
const PORT = process.env.PORT || 5022;
const server = app.listen(PORT, () => {
    logger.info(`Identity Service running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle graceful shutdown
const shutdown = () => {
    logger.info('Received shutdown signal, closing server and database connections...');

    server.close(async () => {
        logger.info('HTTP server closed');
        try {
            await dbPool.close();
            logger.info('Database connections closed');
            process.exit(0);
        } catch (err) {
            logger.error('Error during graceful shutdown:', err);
            process.exit(1);
        }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

// Handle different termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    shutdown();
}); 