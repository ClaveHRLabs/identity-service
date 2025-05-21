import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Define environment schema with Zod
const envSchema = z.object({
    // Server Configuration
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.string().transform(Number).default('3001'),

    // Database Configuration
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.string().transform(Number).default('5432'),
    DB_NAME: z.string(),
    DB_USER: z.string(),
    DB_PASS: z.string(),

    // JWT Configuration
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    JWT_EXPIRATION: z.string().default('1h'),
    JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
    JWT_REFRESH_EXPIRATION: z.string().default('7d'),

    // Logging Configuration
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

    // App Configuration
    SERVICE_NAME: z.string().default('identity-service'),
    API_PREFIX: z.string().default('/api'),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),

    // Admin Configuration
    ADMIN_KEY: z.string().min(1, 'ADMIN_KEY is required'),

    // OAuth Configuration
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    MICROSOFT_CLIENT_ID: z.string().optional(),
    MICROSOFT_CLIENT_SECRET: z.string().optional(),
    LINKEDIN_CLIENT_ID: z.string().optional(),
    LINKEDIN_CLIENT_SECRET: z.string().optional(),

    // Error Handling
    SHOW_ERROR_STACK: z.string().transform(val => val === 'true').default('false'),
    SHOW_ERROR_DETAILS: z.string().transform(val => val === 'true').default('false')
});

// Parse environment variables or throw error
try {
    envSchema.parse(process.env);
} catch (error) {
    if (error instanceof z.ZodError) {
        console.error("❌ Invalid environment variables:", error.format());
        process.exit(1);
    }
}

export class Config {
    // Server Configuration
    public static readonly NODE_ENV: string = process.env.NODE_ENV || 'development';
    public static readonly PORT: number = Number(process.env.PORT || 3001);
    public static readonly IS_PRODUCTION: boolean = Config.NODE_ENV === 'production';
    public static readonly IS_DEVELOPMENT: boolean = Config.NODE_ENV === 'development';
    public static readonly IS_TEST: boolean = Config.NODE_ENV === 'test';

    // Database Configuration
    public static readonly DB_HOST: string = process.env.DB_HOST || 'localhost';
    public static readonly DB_PORT: number = Number(process.env.DB_PORT || 5432);
    public static readonly DB_NAME: string = process.env.DB_NAME || '';
    public static readonly DB_USER: string = process.env.DB_USER || '';
    public static readonly DB_PASS: string = process.env.DB_PASS || '';

    // JWT Configuration
    public static readonly JWT_SECRET: string = process.env.JWT_SECRET || '';
    public static readonly JWT_EXPIRATION: string = process.env.JWT_EXPIRATION || '1h';
    public static readonly JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || '';
    public static readonly JWT_REFRESH_EXPIRATION: string = process.env.JWT_REFRESH_EXPIRATION || '7d';

    // Logging Configuration
    public static readonly LOG_LEVEL: string = process.env.LOG_LEVEL || 'info';

    // App Configuration
    public static readonly SERVICE_NAME: string = process.env.SERVICE_NAME || 'identity-service';
    public static readonly API_PREFIX: string = process.env.API_PREFIX || '/api';
    public static readonly FRONTEND_URL: string = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Admin Configuration
    public static readonly ADMIN_KEY: string = process.env.ADMIN_KEY || '';

    // OAuth Configuration
    public static readonly GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID || '';
    public static readonly GOOGLE_CLIENT_SECRET: string = process.env.GOOGLE_CLIENT_SECRET || '';
    public static readonly MICROSOFT_CLIENT_ID: string = process.env.MICROSOFT_CLIENT_ID || '';
    public static readonly MICROSOFT_CLIENT_SECRET: string = process.env.MICROSOFT_CLIENT_SECRET || '';
    public static readonly LINKEDIN_CLIENT_ID: string = process.env.LINKEDIN_CLIENT_ID || '';
    public static readonly LINKEDIN_CLIENT_SECRET: string = process.env.LINKEDIN_CLIENT_SECRET || '';

    // Error Handling
    public static readonly SHOW_ERROR_STACK: boolean = process.env.SHOW_ERROR_STACK === 'true';
    public static readonly SHOW_ERROR_DETAILS: boolean = process.env.SHOW_ERROR_DETAILS === 'true';

    // Required value getter with validation
    public static getRequired(key: string): string {
        const value = process.env[key];
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        return value;
    }

    // Optional value getter with default
    public static get(key: string, defaultValue?: string): string {
        return process.env[key] || defaultValue || '';
    }
} 