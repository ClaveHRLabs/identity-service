import { AppConfig, AppConfigSchema, loadConfig } from '@vspl/core';
import { z } from 'zod';

// Create Zod schema for identity service specific configuration
const IdentityServiceConfigSchema = AppConfigSchema.extend({
    // JWT Configuration
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    JWT_EXPIRATION: z.string().default('1h'),
    JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
    JWT_REFRESH_EXPIRATION: z.string().default('7d'),

    // App Configuration
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

    // Service URLs
    NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:5010'),

    // Error Handling
    SHOW_ERROR_STACK: z
        .string()
        .transform((val) => val === 'true')
        .default('false'),
    SHOW_ERROR_DETAILS: z
        .string()
        .transform((val) => val === 'true')
        .default('false'),

    // Service-specific defaults for core fields
    SERVICE_NAME: z.string().default('identity-service'),
    PORT: z
        .string()
        .transform((val) => parseInt(val, 10))
        .default('5002'),
});

// Service-specific configuration type that extends the base config
export interface IdentityConfig extends AppConfig {
    // JWT Configuration
    JWT_SECRET: string;
    JWT_EXPIRATION: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRATION: string;

    // App Configuration
    API_PREFIX: string;
    FRONTEND_URL: string;

    // Admin Configuration
    ADMIN_KEY: string;

    // OAuth Configuration
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    MICROSOFT_CLIENT_ID?: string;
    MICROSOFT_CLIENT_SECRET?: string;
    LINKEDIN_CLIENT_ID?: string;
    LINKEDIN_CLIENT_SECRET?: string;

    // Service URLs
    NOTIFICATION_SERVICE_URL: string;

    // Error Handling
    SHOW_ERROR_STACK: boolean;
    SHOW_ERROR_DETAILS: boolean;

    // Computed properties
    IS_PRODUCTION: boolean;
    IS_DEVELOPMENT: boolean;
    IS_TEST: boolean;
}

// Load configuration using the async loadConfig with options
const loadConfigOptions = {
    env: process.env,
    useAwsSecrets: false,
    useLocalEnvOverride: process.env.USE_LOCAL_ENV_OVERRIDE === 'true',
    loadDotenv: true,
} as const;

// Create async config loader function with safe parsing
async function createConfig(): Promise<IdentityConfig> {
    try {
        // Load environment variables without schema validation
        const env = await loadConfig(loadConfigOptions);

        // Apply IdentityConfig schema validation with safe parsing
        const result = IdentityServiceConfigSchema.safeParse(env);

        if (!result.success) {
            console.error('Invalid identity service configuration:', {
                errors: result.error.format(),
            });
            throw new Error(`Invalid identity service configuration: ${result.error.message}`);
        }

        // Add computed properties
        const finalConfig: IdentityConfig = {
            ...result.data,
            IS_PRODUCTION: result.data.NODE_ENV === 'production',
            IS_DEVELOPMENT: result.data.NODE_ENV === 'development',
            IS_TEST: result.data.NODE_ENV === 'test',
        };

        console.info('Identity service configuration loaded successfully');
        return finalConfig;
    } catch (error) {
        console.error('Failed to load identity service configuration:', error);
        throw error;
    }
}

// Export async config loader function
export async function getConfig(): Promise<IdentityConfig> {
    return await createConfig();
}
