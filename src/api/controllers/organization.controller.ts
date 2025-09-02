import { Request, Response } from 'express';
import { OrganizationService } from '../../services/organization.service';
import { RoleService } from '../../services/role.service';
import { logger, Measure, CatchErrors } from '@vspl/core';
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
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'createOrganization', logLevel: 'info' })
    async createOrganization(req: Request, res: Response): Promise<void> {
        const organizationData = req.body;

        // Pass setup code to service if available
        const organization =
            await this.organizationService.createOrganizationProfile(organizationData);

        res.status(201).json({
            success: true,
            data: organization,
        });
    }

    /**
     * Create a new organization and assign the current user as admin
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'createOrganizationWithAdmin', logLevel: 'info' })
    async createOrganizationWithAdmin(req: Request, res: Response): Promise<void> {
        const { organizationData, userId } = req.body;

        if (!userId) {
            res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
            return;
        }

        // Create the organization
        const organization =
            await this.organizationService.createOrganizationProfile(organizationData);

        // Assign the user as admin
        await this.roleService.assignRoleToUserByName(userId, ROLES.ADMIN, organization.id);

        logger.info('User assigned as admin for new organization', {
            userId,
            organizationId: organization.id,
        });

        res.status(201).json({
            success: true,
            data: organization,
        });
    }

    /**
     * Get organization profile by ID
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'getOrganization', logLevel: 'info' })
    async getOrganization(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const organization = await this.organizationService.getOrganizationProfile(id);

        if (!organization) {
            res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: organization,
        });
    }

    /**
     * Update organization profile
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'updateOrganization', logLevel: 'info' })
    async updateOrganization(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const updateData = req.body;

        const organization = await this.organizationService.updateOrganizationProfile(
            id,
            updateData,
        );

        if (!organization) {
            res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: organization,
        });
    }

    /**
     * Update organization branding (logo and colors)
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'updateOrganizationBranding', logLevel: 'info' })
    async updateOrganizationBranding(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const brandingData = req.body;

        // Make sure we're only updating branding-related fields
        const updateData = {
            logo_url: brandingData.logo_url,
            primary_color: brandingData.primary_color,
            secondary_color: brandingData.secondary_color,
        };

        const organization = await this.organizationService.updateOrganizationProfile(
            id,
            updateData,
        );

        if (!organization) {
            res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: organization,
        });
    }

    /**
     * Complete organization setup process
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'completeOrganizationSetup', logLevel: 'info' })
    async completeOrganizationSetup(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        // Verify organization exists
        const organization = await this.organizationService.getOrganizationProfile(id);

        if (!organization) {
            res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
            return;
        }

        // Mark the organization as fully set up
        // This could include any finalization steps like:
        // - Setting the status to 'active'
        // - Recording setup completion timestamp in metadata
        // - Sending welcome emails
        // - Creating default resources

        const updatedOrg = await this.organizationService.updateOrganizationProfile(id, {
            status: 'active',
            // Store setup completion info in the config field which is JSONB
            config: {
                ...organization.config,
                setup_completed: true,
                setup_completed_at: new Date().toISOString(),
            },
        });

        if (!updatedOrg) {
            res.status(500).json({
                success: false,
                message: 'Failed to update organization status',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Organization setup completed successfully',
            data: {
                id: updatedOrg.id,
                name: updatedOrg.name,
                status: updatedOrg.status,
            },
        });
    }

    /**
     * Delete organization profile
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'deleteOrganization', logLevel: 'info' })
    async deleteOrganization(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const deleted = await this.organizationService.deleteOrganizationProfile(id);

        if (!deleted) {
            res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Organization deleted successfully',
        });
    }

    /**
     * List organization profiles with optional filtering
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'listOrganizations', logLevel: 'info' })
    async listOrganizations(req: Request, res: Response): Promise<void> {
        const { status, subscription_tier, limit = '100', offset = '0' } = req.query;

        const filters: { status?: string; subscription_tier?: string } = {};
        if (status) filters.status = status as string;
        if (subscription_tier) filters.subscription_tier = subscription_tier as string;

        const result = await this.organizationService.getOrganizationProfiles(
            filters,
            Number(limit),
            Number(offset),
        );

        res.status(200).json({
            success: true,
            data: {
                items: result.profiles,
                total: result.total,
                limit: Number(limit),
                offset: Number(offset),
            },
        });
    }
}
