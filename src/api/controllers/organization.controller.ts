import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../../services/organization.service';
import { RoleService } from '../../services/role.service';
import { logger } from '../../utils/logger';
import { ROLES } from '../../models/enums/constants';

export class OrganizationController {
    private organizationService: OrganizationService;
    private roleService: RoleService;

    constructor(organizationService: OrganizationService, roleService?: RoleService) {
        this.organizationService = organizationService;
        this.roleService = roleService || new RoleService();
    }

    /**
     * Create a new organization profile
     */
    async createOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationData = req.body;

            // Pass setup code to service if available
            const organization = await this.organizationService.createOrganizationProfile(
                organizationData,
                req.setupCode
            );

            res.status(201).json({
                success: true,
                data: organization
            });
        } catch (error) {
            logger.error('Error creating organization', { error });
            next(error);
        }
    }

    /**
     * Create a new organization and assign the current user as admin
     */
    async createOrganizationWithAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { organizationData, userId } = req.body;

            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
                return;
            }

            // Create the organization
            const organization = await this.organizationService.createOrganizationProfile(
                organizationData
            );

            // Assign the user as admin
            try {
                await this.roleService.assignRoleToUserByName(
                    userId,
                    ROLES.ADMIN,
                    organization.id
                );
                
                logger.info('User assigned as admin for new organization', {
                    userId,
                    organizationId: organization.id
                });
            } catch (roleError) {
                logger.error('Failed to assign admin role to user', {
                    error: roleError,
                    userId,
                    organizationId: organization.id
                });
                
                // Continue with the response even if role assignment fails
                // The organization was created successfully
            }

            res.status(201).json({
                success: true,
                data: organization
            });
        } catch (error) {
            logger.error('Error creating organization with admin', { error });
            next(error);
        }
    }

    /**
     * Get organization profile by ID
     */
    async getOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const organization = await this.organizationService.getOrganizationProfile(id, req.setupCode);

            if (!organization) {
                res.status(404).json({
                    success: false,
                    message: 'Organization not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: organization
            });
        } catch (error) {
            logger.error('Error getting organization', { error, id: req.params.id });
            next(error);
        }
    }

    /**
     * Update organization profile
     */
    async updateOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const organization = await this.organizationService.updateOrganizationProfile(
                id,
                updateData,
                req.setupCode
            );

            if (!organization) {
                res.status(404).json({
                    success: false,
                    message: 'Organization not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: organization
            });
        } catch (error) {
            logger.error('Error updating organization', { error, id: req.params.id });
            next(error);
        }
    }

    /**
     * Update organization branding (logo and colors)
     */
    async updateOrganizationBranding(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const brandingData = req.body;

            // Make sure we're only updating branding-related fields
            const updateData = {
                logo_url: brandingData.logo_url,
                primary_color: brandingData.primary_color,
                secondary_color: brandingData.secondary_color
            };

            const organization = await this.organizationService.updateOrganizationProfile(
                id,
                updateData,
                req.setupCode
            );

            if (!organization) {
                res.status(404).json({
                    success: false,
                    message: 'Organization not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: organization
            });
        } catch (error) {
            logger.error('Error updating organization branding', { error, id: req.params.id });
            next(error);
        }
    }

    /**
     * Complete organization setup process
     */
    async completeOrganizationSetup(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            // Verify organization exists
            const organization = await this.organizationService.getOrganizationProfile(id, req.setupCode);

            if (!organization) {
                res.status(404).json({
                    success: false,
                    message: 'Organization not found'
                });
                return;
            }

            // Mark the organization as fully set up
            // This could include any finalization steps like:
            // - Setting the status to 'active'
            // - Recording setup completion timestamp in metadata
            // - Sending welcome emails
            // - Creating default resources

            const updatedOrg = await this.organizationService.updateOrganizationProfile(
                id,
                {
                    status: 'active',
                    // Store setup completion info in the config field which is JSONB
                    config: {
                        ...organization.config,
                        setup_completed: true,
                        setup_completed_at: new Date().toISOString()
                    }
                },
                req.setupCode
            );

            if (!updatedOrg) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to update organization status'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Organization setup completed successfully',
                data: {
                    id: updatedOrg.id,
                    name: updatedOrg.name,
                    status: updatedOrg.status
                }
            });
        } catch (error) {
            logger.error('Error completing organization setup', { error, id: req.params.id });
            next(error);
        }
    }

    /**
     * Delete organization profile
     */
    async deleteOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const deleted = await this.organizationService.deleteOrganizationProfile(id, req.setupCode);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Organization not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Organization deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting organization', { error, id: req.params.id });
            next(error);
        }
    }

    /**
     * List organization profiles with optional filtering
     */
    async listOrganizations(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { status, subscription_tier, limit = '100', offset = '0' } = req.query;

            const filters: { status?: string; subscription_tier?: string } = {};
            if (status) filters.status = status as string;
            if (subscription_tier) filters.subscription_tier = subscription_tier as string;

            const result = await this.organizationService.getOrganizationProfiles(
                filters,
                Number(limit),
                Number(offset),
                req.setupCode
            );

            res.status(200).json({
                success: true,
                data: {
                    items: result.profiles,
                    total: result.total,
                    limit: Number(limit),
                    offset: Number(offset)
                }
            });
        } catch (error) {
            logger.error('Error listing organizations', { error, query: req.query });
            next(error);
        }
    }
} 