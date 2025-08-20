/**
 * Application-wide constants for the Identity Service
 * 
 * This file contains all magic numbers, strings, and configuration values
 * used throughout the identity service to ensure consistency and maintainability.
 */

/**
 * Authentication related custom headers
 */
export enum AuthHeader {
    USER_ID = 'x-user-id',
    USER_EMAIL = 'x-user-email',
    ORG_ID = 'x-organization-id',
    EMPLOYEE_ID = 'x-employee-id',
    USER_ROLES = 'x-user-roles',
    USER_PERMISSIONS = 'x-user-permissions',
    SERVICE_KEY = 'x-service-key',
    SERVICE_NAME = 'x-service-name',
    API_KEY = 'x-api-key',
}

/**
 * Standard HTTP header constants
 */
export enum StandardHeader {
    CONTENT_TYPE = 'Content-Type',
    ACCEPT = 'Accept',
    REQUEST_ID = 'x-request-id',
}

/**
 * Rate Limiting Constants
 */
export const RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100, // Maximum requests per window
} as const;

/**
 * Timeout Constants
 */
export const TIMEOUTS = {
    DEFAULT_HTTP_TIMEOUT_MS: 10000, // 10 seconds
    GRACEFUL_SHUTDOWN_TIMEOUT_MS: 10000, // 10 seconds
} as const;

/**
 * Pagination Constants
 */
export const PAGINATION = {
    DEFAULT_LIMIT: 50,
    DEFAULT_OFFSET: 0,
    MAX_LIMIT: 100,
} as const;

/**
 * Token Constants
 */
export const TOKEN = {
    MIN_LENGTH: 20,
    DEFAULT_LENGTH: 32,
    READABLE_TOKEN_LENGTH: 64,
    MAGIC_LINK_EXPIRATION_MINUTES: 15,
    DEFAULT_EXPIRATION_MINUTES: 30,
    DEFAULT_EXPIRATION_HOURS: 24,
} as const;

/**
 * OAuth Provider URLs
 */
export const OAUTH_URLS = {
    GOOGLE: {
        AUTH: 'https://accounts.google.com/o/oauth2/v2/auth',
        TOKEN: 'https://oauth2.googleapis.com/token',
        USER_INFO: 'https://www.googleapis.com/oauth2/v3/userinfo',
    },
    MICROSOFT: {
        AUTH: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        TOKEN: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        USER_INFO: 'https://graph.microsoft.com/v1.0/me',
    },
    LINKEDIN: {
        AUTH: 'https://www.linkedin.com/oauth/v2/authorization',
        TOKEN: 'https://www.linkedin.com/oauth/v2/accessToken',
        USER_INFO: 'https://api.linkedin.com/v2/userinfo',
    },
} as const;

/**
 * OAuth Scopes
 */
export const OAUTH_SCOPES = {
    GOOGLE: ['openid', 'profile', 'email'],
    MICROSOFT: ['openid', 'profile', 'email'],
    LINKEDIN: ['r_liteprofile', 'r_emailaddress'],
} as const;

/**
 * Authentication Constants
 */
export const AUTH = {
    BEARER_PREFIX: 'Bearer',
    STATE_PARAM_LENGTH: 2,
    RANDOM_TOKEN_LENGTH: 15,
} as const;

/**
 * Code Generation Constants
 */
export const CODE_GENERATION = {
    UPPERCASE_CHARS: 'ABCDEFGHJKLMNPQRSTUVWXYZ', // Omit O and I for readability
    LOWERCASE_CHARS: 'abcdefghijkmnpqrstuvwxyz', // Omit l and o for readability  
    NUMBERS: '23456789', // Omit 0 and 1 for readability
    SYMBOLS: '!@#$%^&*-_=+',
    READABLE_CHARS: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    DEFAULT_CODE_LENGTH: 10,
    DEFAULT_HEX_BYTE_LENGTH: 16,
} as const;

/**
 * Session Constants
 */
export const SESSION = {
    DEFAULT_TIMEOUT_MINUTES: 480, // 8 hours
} as const;

/**
 * HTTP Client Constants
 */
export const HTTP_CLIENT = {
    MAX_RETRIES: 3,
    BASE_DELAY_MS: 300,
    EXPONENTIAL_BACKOFF: true,
} as const;

/**
 * Validation Constants
 */
export const VALIDATION = {
    MIN_NAME_LENGTH: 2,
    COLOR_REGEX: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
} as const;

/**
 * Environment Values
 */
export const ENVIRONMENTS = {
    PRODUCTION: 'production',
    DEVELOPMENT: 'development',
    TEST: 'test',
} as const;

/**
 * Rate Limit Messages
 */
export const MESSAGES = {
    RATE_LIMIT_EXCEEDED: 'Too many requests from this IP, please try again later.',
} as const;
