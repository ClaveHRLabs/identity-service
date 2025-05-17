import { logger } from '../utils/logger';
import { RoleService } from './role.service';

/**
 * Service to handle role assignment validation and business rules
 */
export class RoleAssignmentService {
    private roleService: RoleService;
    
    constructor() {
        this.roleService = new RoleService();
    }

    /**
     * Validate if a user can assign a specific role to another user
     * @param assignerId The ID of the user assigning the role
     * @param roleToAssign The role name being assigned
     * @param organizationId The organization ID context (optional)
     */
    async validateRoleAssignment(
        assignerId: string,
        roleToAssign: string,
        organizationId?: string
    ): Promise<boolean> {
        logger.info('Validating role assignment permissions', {
            assignerId,
            roleToAssign,
            organizationId
        });

        try {
            // Check if assigner is a super_admin (can assign any role)
            const isSuperAdmin = await this.roleService.userHasRole(assignerId, 'super_admin');
            if (isSuperAdmin) return true;

            // Check if assigner is a clavehr_operator (can assign most roles)
            const isClaveHrOperator = await this.roleService.userHasRole(assignerId, 'clavehr_operator');
            if (isClaveHrOperator) {
                // ClaveHR Operators cannot assign super_admin
                if (roleToAssign === 'super_admin') {
                    logger.warn('ClaveHR Operator attempted to assign super_admin role', { assignerId });
                    return false;
                }
                return true;
            }

            // Check if assigner is an organization_admin (can assign org-level roles)
            const isOrgAdmin = await this.roleService.userHasRole(
                assignerId,
                'organization_admin',
                organizationId
            );

            if (isOrgAdmin) {
                // Organization admins can assign these roles
                const assignableRoles = [
                    'organization_manager',
                    'hr_manager',
                    'hiring_manager',
                    'team_manager',
                    'employee',
                    'recruiter',
                    'learning_specialist',
                    'succession_planner'
                ];

                if (assignableRoles.includes(roleToAssign)) {
                    return true;
                }
            }

            // Check if assigner is an organization_manager (limited assignment rights)
            const isOrgManager = await this.roleService.userHasRole(
                assignerId,
                'organization_manager',
                organizationId
            );

            if (isOrgManager) {
                // Organization managers can only assign these roles
                const assignableRoles = [
                    'employee',
                    'team_manager'
                ];

                if (assignableRoles.includes(roleToAssign)) {
                    return true;
                }
            }

            // HR managers can assign basic roles
            const isHrManager = await this.roleService.userHasRole(
                assignerId,
                'hr_manager',
                organizationId
            );

            if (isHrManager) {
                // HR managers can only assign employee role
                if (roleToAssign === 'employee') {
                    return true;
                }
            }

            logger.warn('User lacks permission to assign role', {
                assignerId,
                roleToAssign,
                organizationId
            });

            return false;
        } catch (error) {
            logger.error('Error validating role assignment', {
                error: error instanceof Error ? error.message : 'Unknown error',
                assignerId,
                roleToAssign
            });
            throw error;
        }
    }

    /**
     * Get list of roles that a user can assign
     * @param userId The ID of the user
     * @param organizationId The organization ID context (optional)
     */
    async getAssignableRoles(userId: string, organizationId?: string): Promise<string[]> {
        // Check user roles to determine which roles they can assign
        const isSuperAdmin = await this.roleService.userHasRole(userId, 'super_admin');
        if (isSuperAdmin) {
            return [
                'super_admin',
                'organization_admin',
                'organization_manager',
                'hr_manager',
                'hiring_manager',
                'team_manager',
                'employee',
                'recruiter',
                'learning_specialist',
                'succession_planner',
                'clavehr_operator'
            ];
        }

        const isClaveHrOperator = await this.roleService.userHasRole(userId, 'clavehr_operator');
        if (isClaveHrOperator) {
            return [
                'organization_admin',
                'organization_manager',
                'hr_manager',
                'hiring_manager',
                'team_manager',
                'employee',
                'recruiter',
                'learning_specialist',
                'succession_planner',
                'clavehr_operator'
            ];
        }

        const isOrgAdmin = await this.roleService.userHasRole(
            userId,
            'organization_admin',
            organizationId
        );

        if (isOrgAdmin) {
            return [
                'organization_manager',
                'hr_manager',
                'hiring_manager',
                'team_manager',
                'employee',
                'recruiter',
                'learning_specialist',
                'succession_planner'
            ];
        }

        const isOrgManager = await this.roleService.userHasRole(
            userId,
            'organization_manager',
            organizationId
        );

        if (isOrgManager) {
            return [
                'employee',
                'team_manager'
            ];
        }

        const isHrManager = await this.roleService.userHasRole(
            userId,
            'hr_manager',
            organizationId
        );

        if (isHrManager) {
            return ['employee'];
        }

        // Default: no assignable roles
        return [];
    }
} 