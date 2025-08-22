/**
 * Database utilities for accessing the DatabaseService from the DI container
 */

import { getDependency, SERVICE_NAMES } from '../di';
import { DatabaseService } from '../services/database.service';

/**
 * Get the DatabaseService from the DI container
 * This ensures all database operations go through the container
 */
export function getDatabase(): DatabaseService {
    return getDependency<DatabaseService>(SERVICE_NAMES.DATABASE_SERVICE);
}

/**
 * Helper function for executing queries
 */
export async function query(text: string, params: any[] = []): Promise<any> {
    const db = getDatabase();
    return db.query(text, params);
}

/**
 * Helper function for executing transactions
 */
export async function transaction<T>(operations: (client: any) => Promise<T>): Promise<T> {
    const db = getDatabase();
    return db.transaction(operations);
}

/**
 * Helper function for executing with client
 */
export async function withClient<T>(operations: (client: any) => Promise<T>): Promise<T> {
    const db = getDatabase();
    return db.withClient(operations);
}
