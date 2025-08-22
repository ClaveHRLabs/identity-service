import { logger } from '@vspl/core';
import { RoleService } from './role.service';
import { UserRole } from '@vspl/core';

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
        organizationId?: string,
    ): Promise<boolean> {
        logger.info('Validating role assignment permissions', {
            assignerId,
            roleToAssign,
            organizationId,
        });

        try {
            // Check if assigner is a super_admin (can assign any role)
            const isSuperAdmin = await this.roleService.userHasRole(
                assignerId,
                UserRole.SUPER_ADMIN,
            );
            if (isSuperAdmin) return true;

            // Check if assigner is a clavehr_operator (can assign most roles)
            const isClaveHrOperator = await this.roleService.userHasRole(
                assignerId,
                UserRole.CLAVEHR_OPERATOR,
            );
            if (isClaveHrOperator) {
                // ClaveHR Operators cannot assign super_admin
                if (roleToAssign === UserRole.SUPER_ADMIN) {
                    logger.warn('ClaveHR Operator attempted to assign super_admin role', {
                        assignerId,
                    });
                    return false;
                }
                return true;
            }

            // Check if assigner is an organization_admin (can assign org-level roles)
            const isOrgAdmin = await this.roleService.userHasRole(
                assignerId,
                UserRole.ORGANIZATION_ADMIN,
                organizationId,
            );

            if (isOrgAdmin) {
                // Organization admins can assign these roles
                const assignableRoles = [
                    UserRole.ORGANIZATION_MANAGER,
                    UserRole.HR_MANAGER,
                    UserRole.HIRING_MANAGER,
                    UserRole.TEAM_MANAGER,
                    UserRole.EMPLOYEE,
                    UserRole.RECRUITER,
                    UserRole.LEARNING_SPECIALIST,
                    UserRole.SUCCESSION_PLANNER,
                ];

                if (assignableRoles.includes(roleToAssign as UserRole)) {
                    return true;
                }
            }

            // Check if assigner is an organization_manager (limited assignment rights)
            const isOrgManager = await this.roleService.userHasRole(
                assignerId,
                UserRole.ORGANIZATION_MANAGER,
                organizationId,
            );

            if (isOrgManager) {
                // Organization managers can only assign these roles
                const assignableRoles = [UserRole.EMPLOYEE, UserRole.TEAM_MANAGER];

                if (assignableRoles.includes(roleToAssign as UserRole)) {
                    return true;
                }
            }

            // HR managers can assign basic roles
            const isHrManager = await this.roleService.userHasRole(
                assignerId,
                UserRole.HR_MANAGER,
                organizationId,
            );

            if (isHrManager) {
                // HR managers can only assign employee role
                if (roleToAssign === UserRole.EMPLOYEE) {
                    return true;
                }
            }

            logger.warn('User lacks permission to assign role', {
                assignerId,
                roleToAssign,
                organizationId,
            });

            return false;
        } catch (error) {
            logger.error('Error validating role assignment', {
                error: error instanceof Error ? error.message : 'Unknown error',
                assignerId,
                roleToAssign,
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
        const isSuperAdmin = await this.roleService.userHasRole(userId, UserRole.SUPER_ADMIN);
        if (isSuperAdmin) {
            return [
                UserRole.SUPER_ADMIN,
                UserRole.ORGANIZATION_ADMIN,
                UserRole.ORGANIZATION_MANAGER,
                UserRole.HR_MANAGER,
                UserRole.HIRING_MANAGER,
                UserRole.TEAM_MANAGER,
                UserRole.EMPLOYEE,
                UserRole.RECRUITER,
                UserRole.LEARNING_SPECIALIST,
                UserRole.SUCCESSION_PLANNER,
                UserRole.CLAVEHR_OPERATOR,
            ];
        }

        const isClaveHrOperator = await this.roleService.userHasRole(
            userId,
            UserRole.CLAVEHR_OPERATOR,
        );
        if (isClaveHrOperator) {
            return [
                UserRole.ORGANIZATION_ADMIN,
                UserRole.ORGANIZATION_MANAGER,
                UserRole.HR_MANAGER,
                UserRole.HIRING_MANAGER,
                UserRole.TEAM_MANAGER,
                UserRole.EMPLOYEE,
                UserRole.RECRUITER,
                UserRole.LEARNING_SPECIALIST,
                UserRole.SUCCESSION_PLANNER,
                UserRole.CLAVEHR_OPERATOR,
            ];
        }

        const isOrgAdmin = await this.roleService.userHasRole(
            userId,
            UserRole.ORGANIZATION_ADMIN,
            organizationId,
        );

        if (isOrgAdmin) {
            return [
                UserRole.ORGANIZATION_MANAGER,
                UserRole.HR_MANAGER,
                UserRole.HIRING_MANAGER,
                UserRole.TEAM_MANAGER,
                UserRole.EMPLOYEE,
                UserRole.RECRUITER,
                UserRole.LEARNING_SPECIALIST,
                UserRole.SUCCESSION_PLANNER,
            ];
        }

        const isOrgManager = await this.roleService.userHasRole(
            userId,
            UserRole.ORGANIZATION_MANAGER,
            organizationId,
        );

        if (isOrgManager) {
            return [UserRole.EMPLOYEE, UserRole.TEAM_MANAGER];
        }

        const isHrManager = await this.roleService.userHasRole(
            userId,
            UserRole.HR_MANAGER,
            organizationId,
        );

        if (isHrManager) {
            return [UserRole.EMPLOYEE];
        }

        // Default: no assignable roles
        return [];
    }
}
