/**
 * Enum representing all available user roles in the system
 */
export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    ORGANIZATION_ADMIN = 'organization_admin',
    ORGANIZATION_MANAGER = 'organization_manager',
    HR_MANAGER = 'hr_manager',
    HIRING_MANAGER = 'hiring_manager',
    TEAM_MANAGER = 'team_manager',
    EMPLOYEE = 'employee',
    RECRUITER = 'recruiter',
    LEARNING_SPECIALIST = 'learning_specialist',
    SUCCESSION_PLANNER = 'succession_planner',
    CLAVEHR_OPERATOR = 'clavehr_operator'
}

/**
 * Enum representing available permissions in the system
 */
export enum Permission {
    MANAGE_SYSTEM = 'manage_system',
    VIEW_SYSTEM_LOGS = 'view_system_logs',
    MANAGE_ORGANIZATIONS = 'manage_organizations',
    MANAGE_ORGANIZATION_SETTINGS = 'manage_organization_settings',
    MANAGE_USERS = 'manage_users',
    VIEW_ALL_USERS = 'view_all_users',
    MANAGE_ROLES = 'manage_roles',
    MANAGE_ONBOARDING = 'manage_onboarding',
    MANAGE_OFFBOARDING = 'manage_offboarding',
    MANAGE_PERFORMANCE = 'manage_performance',
    VIEW_PERFORMANCE_REPORTS = 'view_performance_reports',
    MANAGE_GOALS = 'manage_goals',
    MANAGE_SUCCESSION = 'manage_succession',
    MANAGE_LEARNING = 'manage_learning',
    MANAGE_RECRUITMENT = 'manage_recruitment',
    VIEW_ANALYTICS = 'view_analytics'
} 