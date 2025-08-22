import { Pool, QueryResult, PoolClient } from 'pg';
import { query, withTransaction, withDbClient } from '@vspl/core';

/**
 * Simple database service that provides direct access to database operations
 */
export class DatabaseService {
    constructor(private pool: Pool) {}

    /**
     * Execute a query with parameters
     */
    async query(text: string, params: any[] = []): Promise<QueryResult> {
        return query(this.pool, text, params);
    }

    /**
     * Execute multiple operations within a transaction
     */
    async transaction<T>(operations: (client: PoolClient) => Promise<T>): Promise<T> {
        return withTransaction(this.pool, operations);
    }

    /**
     * Execute operations with a database client
     */
    async withClient<T>(operations: (client: PoolClient) => Promise<T>): Promise<T> {
        return withDbClient(this.pool, operations);
    }

    /**
     * Get the underlying pool (for advanced use cases)
     */
    getPool(): Pool {
        return this.pool;
    }
}
