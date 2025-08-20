import { createLogger, createSingleton } from '@vspl/core';
import { SERVICE_NAME, LOG_LEVEL } from '../config/config';

// Create singleton logger instance
export const logger = createSingleton(() =>
    createLogger({
        service: SERVICE_NAME,
        level: LOG_LEVEL,
    }),
)();

// Export the logger for backward compatibility
export default logger;
