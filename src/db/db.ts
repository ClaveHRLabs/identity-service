import { Pool, PoolClient, QueryResult } from 'pg';
import { Config } from '../config/config';
import { logger } from '../utils/logger';

// Create connection pool
const pool = new Pool({
    host: Config.DB_HOST,
    port: Config.DB_PORT,
    database: Config.DB_NAME,
    user: Config.DB_USER,
    password: Config.DB_PASS,
    max: 4, // Maximum connection pool size
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error if connection takes longer than 2 seconds
});

// Log pool events
pool.on('connect', () => {
    logger.debug('New client connected to PostgreSQL');
});

pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', {
        error: err.message,
        stack: err.stack,
        code: (err as any).code,
    });
    // Don't exit process here to allow graceful shutdown
});

/**
 * Execute a query with timing and logging
 */
export const query = async (text: string, params: any[] = []): Promise<QueryResult> => {
    const start = Date.now();

    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;

        logger.debug(`Executed query in ${duration}ms`, {
            query: text.replace(/\s+/g, ' ').trim(),
            rows: result.rowCount,
            duration,
        });

        return result;
    } catch (error) {
        const duration = Date.now() - start;

        logger.error(`Query failed after ${duration}ms`, {
            query: text.replace(/\s+/g, ' ').trim(),
            params,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });

        throw error;
    }
};

/**
 * Get a client from the pool and return methods for transaction handling
 */
export const getClient = async () => {
    const client = await pool.connect();

    return {
        query: (text: string, params: any[] = []): Promise<QueryResult> => client.query(text, params),
        begin: () => client.query('BEGIN'),
        commit: () => client.query('COMMIT'),
        rollback: () => client.query('ROLLBACK'),
        release: () => client.release(),
    };
};

/**
 * Close the pool
 */
export const close = async (): Promise<void> => {
    await pool.end();
};

// Export a singleton instance
export default {
    query,
    getClient,
    close
}; 