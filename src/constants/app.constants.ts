/**
 * Application-wide constants for the Identity Service
 *
 * This file contains all magic numbers, strings, and configuration values
 * used throughout the identity service to ensure consistency and maintainability.
 */

import {
    TOKEN_CONSTANTS,
    CODE_GENERATION_CONSTANTS,
    AuthHeader as CoreAuthHeader,
    StandardHeader as CoreStandardHeader,
} from '@vspl/core';

/**
 * Authentication related custom headers - imported from @vspl/core
 */
export const AuthHeader = {
    ...CoreAuthHeader,
    // Add any identity-service specific headers here if needed
} as const;

/**
 * Standard HTTP header constants - imported from @vspl/core
 */
export const StandardHeader = {
    ...CoreStandardHeader,
    // Add any identity-service specific headers here if needed
} as const;

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
    DEFAULT_HTTP_TIMEOUT_MS: 5000, // 5 seconds
    GRACEFUL_SHUTDOWN_TIMEOUT_MS: 5000, // 5 seconds
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
 * Token Constants - imported from @vspl/core
 */
export const TOKEN = TOKEN_CONSTANTS;

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
 * Code Generation Constants - imported from @vspl/core
 */
export const CODE_GENERATION = CODE_GENERATION_CONSTANTS;

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
