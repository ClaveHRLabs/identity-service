/**
 * Service name constants for dependency injection container
 * Centralized to avoid magic strings and enable refactoring
 */

// Infrastructure Services
export const SERVICE_NAMES = {
    // Core Infrastructure
    CONFIG: 'config',
    DB_POOL: 'dbPool',
    HTTP_CLIENT: 'httpClient',
    RATE_LIMITER: 'rateLimiter',

    // Database Service
    DATABASE_SERVICE: 'databaseService',

    // Business Services
    USER_SERVICE: 'userService',
    AUTH_SERVICE: 'authService',
    EMAIL_SERVICE: 'emailService',
    ORGANIZATION_SERVICE: 'organizationService',
    SETUP_CODE_SERVICE: 'setupCodeService',
    ROLE_SERVICE: 'roleService',
    ROLE_ASSIGNMENT_SERVICE: 'roleAssignmentService',

    // Controllers
    USER_CONTROLLER: 'userController',
    AUTH_CONTROLLER: 'authController',
    ORGANIZATION_CONTROLLER: 'organizationController',
    SETUP_CODE_CONTROLLER: 'setupCodeController',
    ROLE_CONTROLLER: 'roleController',

    // Application
    EXPRESS_APP: 'app',
} as const;

// Type for service names (enables autocomplete and type checking)
export type ServiceName = (typeof SERVICE_NAMES)[keyof typeof SERVICE_NAMES];
