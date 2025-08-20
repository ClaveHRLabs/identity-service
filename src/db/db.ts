import {
    createDbPool,
    query as coreQuery,
    withDbClient,
    withTransaction,
    createSingleton,
    createLogger,
    type Pool,
} from '@vspl/core';
import { Config } from '../config/config';

// Create logger for database operations
const dbLogger = createLogger({ service: 'database' });

// Create singleton database pool
export const dbPool = createSingleton(() => {
    dbLogger.info('Creating database connection pool', {
        host: Config.DB_HOST,
        port: Config.DB_PORT,
        database: Config.DB_NAME,
        maxConnections: Config.DB_MAX_POOL_SIZE || 20,
    });

    return createDbPool({
        DB_HOST: Config.DB_HOST,
        DB_PORT: Config.DB_PORT,
        DB_NAME: Config.DB_NAME,
        DB_USER: Config.DB_USER,
        DB_PASS: Config.DB_PASS,
        DB_SSL: Config.DB_SSL || false,
        DB_MAX_POOL_SIZE: Config.DB_MAX_POOL_SIZE,
        DB_IDLE_TIMEOUT_MS: Config.DB_IDLE_TIMEOUT_MS || 30000,
        DB_CONNECTION_TIMEOUT_MS: Config.DB_CONNECTION_TIMEOUT_MS || 2000,
    });
});

/**
 * Execute a query with timing and logging
 */
export const query = async (text: string, params: any[] = []): Promise<any> => {
    const start = Date.now();

    try {
        const result = await coreQuery(dbPool(), text, params);
        const duration = Date.now() - start;

        dbLogger.debug(`Executed query in ${duration}ms`, {
            query: text.replace(/\s+/g, ' ').trim(),
            rows: result.rowCount,
            duration,
        });

        return result;
    } catch (error) {
        const duration = Date.now() - start;

        dbLogger.error(`Query failed after ${duration}ms`, {
            query: text.replace(/\s+/g, ' ').trim(),
            params,
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
    }
};

/**
 * Execute a function within a transaction
 */
export const executeTransaction = async <T>(fn: (client: any) => Promise<T>): Promise<T> => {
    return withTransaction(dbPool(), fn);
};

/**
 * Execute a function with a database client
 */
export const executeWithClient = async <T>(fn: (client: any) => Promise<T>): Promise<T> => {
    return withDbClient(dbPool(), fn);
};

/**
 * Close the database pool
 */
export const close = async (): Promise<void> => {
    try {
        const { closePool } = await import('@vspl/core');
        await closePool(dbPool());
        dbLogger.info('Database connection pool closed');
    } catch (error) {
        dbLogger.error('Error closing database pool', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
};

// Health check function for the database
export const healthCheck = async (): Promise<{ status: string; details?: any }> => {
    try {
        const result = await query('SELECT 1 as health_check');

        if (result.rows.length > 0 && result.rows[0].health_check === 1) {
            return { status: 'healthy' };
        } else {
            return { status: 'unhealthy', details: 'Unexpected query result' };
        }
    } catch (error) {
        dbLogger.error('Database health check failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
            status: 'unhealthy',
            details: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};

// Export default object for backwards compatibility
export default {
    query,
    executeTransaction,
    executeWithClient,
    close,
    healthCheck,
};

// Export the pool type for use in other modules
export type DatabasePool = Pool;
