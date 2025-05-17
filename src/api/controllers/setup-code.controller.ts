import { Request, Response, NextFunction } from 'express';
import { SetupCodeService } from '../../services/setup-code.service';
import { logger } from '../../utils/logger';

export class SetupCodeController {
    private readonly setupCodeService: SetupCodeService;

    constructor(setupCodeService: SetupCodeService) {
        this.setupCodeService = setupCodeService;
    }

    /**
     * Create a new organization setup code
     */
    async createSetupCode(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const setupCodeData = req.body;

            // Add admin information from the header if available
            const adminKey = req.header('x-clavehr-admin-key');
            if (adminKey) {
                setupCodeData.created_by_admin = 'ClaveHR Admin';
            }

            const setupCode = await this.setupCodeService.createSetupCode(setupCodeData);

            res.status(201).json({
                success: true,
                data: setupCode
            });
        } catch (error) {
            logger.error('Error creating setup code', { error });
            next(error);
        }
    }

    /**
     * Get all setup codes for an organization
     */
    async getOrganizationSetupCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { organizationId } = req.params;
            const { includeUsed } = req.query;

            const setupCodes = await this.setupCodeService.getSetupCodesByOrganization(
                organizationId,
                includeUsed === 'true'
            );

            res.status(200).json({
                success: true,
                data: setupCodes
            });
        } catch (error) {
            logger.error('Error getting organization setup codes', {
                error,
                organizationId: req.params.organizationId
            });
            next(error);
        }
    }

    /**
     * Validate and use a setup code
     */
    async validateSetupCode(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { code } = req.body;

            const result = await this.setupCodeService.validateAndUseSetupCode(code);

            if (!result.success) {
                res.status(400).json({
                    success: false,
                    message: result.message || 'Invalid setup code'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    organization: result.organization
                }
            });
        } catch (error) {
            logger.error('Error validating setup code', { error, code: req.body.code });
            next(error);
        }
    }

    /**
     * Delete a setup code
     */
    async deleteSetupCode(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const deleted = await this.setupCodeService.deleteSetupCode(id);

            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Setup code not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Setup code deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting setup code', { error, id: req.params.id });
            next(error);
        }
    }
} 