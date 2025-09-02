import { Request, Response } from 'express';
import { SetupCodeService } from '../../services/setup-code.service';
import { CatchErrors, logger, Measure } from '@vspl/core';

export class SetupCodeController {
    private readonly setupCodeService: SetupCodeService;

    constructor(setupCodeService: SetupCodeService) {
        this.setupCodeService = setupCodeService;
    }

    /**
     * Create a new organization setup code
     * If organization_id is not provided, looks up or creates an organization by name
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'createSetupCode', logLevel: 'info' })
    async createSetupCode(req: Request, res: Response): Promise<void> {
        const setupCodeData = req.body;

        // Add user information if authenticated
        if (req.user) {
            setupCodeData.created_by = req.user.id;
        }

        // Extract organization information
        const organizationId = setupCodeData.organization_id;
        const organizationName = setupCodeData.organization_name;

        // Log the setup code creation attempt
        logger.info('Creating setup code', {
            organizationId,
            organizationName,
            user: req.user?.email || 'unknown',
        });

        // Validate that at least one of organization_id or organization_name is provided
        if (!organizationId && !organizationName) {
            res.status(400).json({
                success: false,
                message: 'Either organization_id or organization_name must be provided',
            });
            return;
        }

        const setupCode = await this.setupCodeService.createSetupCode(setupCodeData);

        res.status(201).json({
            success: true,
            data: setupCode,
        });
    }

    /**
     * Get all setup codes for an organization
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'getOrganizationSetupCodes', logLevel: 'info' })
    async getOrganizationSetupCodes(req: Request, res: Response): Promise<void> {
        const { organizationId } = req.params;
        const { includeUsed } = req.query;

        const setupCodes = await this.setupCodeService.getSetupCodesByOrganization(
            organizationId,
            includeUsed === 'true',
        );

        res.status(200).json({
            success: true,
            data: setupCodes,
        });
    }

    /**
     * Validate and use a setup code
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'validateSetupCode', logLevel: 'info' })
    async validateSetupCode(req: Request, res: Response): Promise<void> {
        const { code } = req.body;

        const result = await this.setupCodeService.validateAndUseSetupCode(code);

        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.message || 'Invalid setup code',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                organization: result.organization,
            },
        });
    }

    /**
     * Delete a setup code
     */
    @CatchErrors({ rethrow: false })
    @Measure({ metricName: 'deleteSetupCode', logLevel: 'info' })
    async deleteSetupCode(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const deleted = await this.setupCodeService.deleteSetupCode(id);

        if (!deleted) {
            res.status(404).json({
                success: false,
                message: 'Setup code not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Setup code deleted successfully',
        });
    }
}
