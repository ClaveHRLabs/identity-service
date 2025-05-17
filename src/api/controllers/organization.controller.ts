import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../../services/organization.service';
import { logger } from '../../utils/logger';

export class OrganizationController {
    private organizationService: OrganizationService;

    constructor(organizationService: OrganizationService) {
        this.organizationService = organizationService;
    }

    /**
     * Create a new organization profile
     */
    async createOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationData = req.body;
            const organization = await this.organizationService.createOrganizationProfile(organizationData);

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
     * Get organization profile by ID
     */
    async getOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const organization = await this.organizationService.getOrganizationProfile(id);

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

            const organization = await this.organizationService.updateOrganizationProfile(id, updateData);

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
     * Delete organization profile
     */
    async deleteOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const deleted = await this.organizationService.deleteOrganizationProfile(id);

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
                Number(offset)
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