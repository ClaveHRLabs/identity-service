import { UserRole, Permission } from './roles.enum';

/**
 * System role names
 */
export const ROLES = {
    SUPER_ADMIN: UserRole.SUPER_ADMIN,
    ADMIN: UserRole.ORGANIZATION_ADMIN,
    MANAGER: UserRole.ORGANIZATION_MANAGER,
    HR_MANAGER: UserRole.HR_MANAGER,
    HIRING_MANAGER: UserRole.HIRING_MANAGER,
    TEAM_MANAGER: UserRole.TEAM_MANAGER,
    EMPLOYEE: UserRole.EMPLOYEE,
    RECRUITER: UserRole.RECRUITER,
    LEARNING_SPECIALIST: UserRole.LEARNING_SPECIALIST,
    SUCCESSION_PLANNER: UserRole.SUCCESSION_PLANNER,
    CLAVEHR_OPERATOR: UserRole.CLAVEHR_OPERATOR
};

/**
 * System permissions
 */
export const PERMISSIONS = {
    MANAGE_SYSTEM: Permission.MANAGE_SYSTEM,
    VIEW_SYSTEM_LOGS: Permission.VIEW_SYSTEM_LOGS,
    MANAGE_ORGANIZATIONS: Permission.MANAGE_ORGANIZATIONS,
    MANAGE_ORGANIZATION_SETTINGS: Permission.MANAGE_ORGANIZATION_SETTINGS,
    MANAGE_USERS: Permission.MANAGE_USERS,
    VIEW_ALL_USERS: Permission.VIEW_ALL_USERS,
    MANAGE_ROLES: Permission.MANAGE_ROLES,
    MANAGE_ONBOARDING: Permission.MANAGE_ONBOARDING,
    MANAGE_OFFBOARDING: Permission.MANAGE_OFFBOARDING,
    MANAGE_PERFORMANCE: Permission.MANAGE_PERFORMANCE,
    VIEW_PERFORMANCE_REPORTS: Permission.VIEW_PERFORMANCE_REPORTS,
    MANAGE_GOALS: Permission.MANAGE_GOALS,
    MANAGE_SUCCESSION: Permission.MANAGE_SUCCESSION,
    MANAGE_LEARNING: Permission.MANAGE_LEARNING,
    MANAGE_RECRUITMENT: Permission.MANAGE_RECRUITMENT,
    VIEW_ANALYTICS: Permission.VIEW_ANALYTICS
};

/**
 * Organization status values
 */
export const ORGANIZATION_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
};

/**
 * Subscription tier values
 */
export const SUBSCRIPTION_TIER = {
    FREE: 'free',
    BASIC: 'basic',
    PRO: 'pro',
    ENTERPRISE: 'enterprise'
};

/**
 * Subscription status values
 */
export const SUBSCRIPTION_STATUS = {
    TRIAL: 'trial',
    ACTIVE: 'active',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
}; 