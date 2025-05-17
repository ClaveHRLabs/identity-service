import { logger } from '../utils/logger';
import * as setupCodeRepository from '../db/setup-code';
import { OrganizationService } from './organization.service';
import {
    OrganizationSetupCode,
    CreateSetupCode,
    OrganizationProfile
} from '../models/schemas/organization';
import { AppError } from '../api/middlewares/error-handler';

export class SetupCodeService {
    private organizationService: OrganizationService;

    constructor(organizationService: OrganizationService) {
        this.organizationService = organizationService;
    }

    /**
     * Create a new setup code for an organization
     */
    async createSetupCode(data: CreateSetupCode): Promise<OrganizationSetupCode> {
        logger.info('Creating new setup code', { organizationId: data.organization_id });

        // Verify organization exists
        const organization = await this.organizationService.getOrganizationProfile(data.organization_id);
        if (!organization) {
            logger.error('Failed to create setup code - organization not found', { organizationId: data.organization_id });
            throw new AppError('Organization not found', 404, 'NOT_FOUND');
        }

        try {
            const setupCode = await setupCodeRepository.createSetupCode(data);
            logger.info('Setup code created successfully', {
                id: setupCode.id,
                code: setupCode.code,
                organizationId: setupCode.organization_id
            });

            return setupCode;
        } catch (error) {
            logger.error('Failed to create setup code', {
                error: error instanceof Error ? error.message : 'Unknown error',
                organizationId: data.organization_id
            });
            throw error;
        }
    }

    /**
     * Get setup code by code string
     */
    async getSetupCode(code: string): Promise<OrganizationSetupCode | null> {
        logger.debug('Fetching setup code', { code });
        return setupCodeRepository.getSetupCodeByCode(code);
    }

    /**
     * Get all setup codes for an organization
     */
    async getSetupCodesByOrganization(
        organizationId: string,
        includeUsed = false
    ): Promise<OrganizationSetupCode[]> {
        logger.debug('Fetching setup codes for organization', { organizationId, includeUsed });

        // Verify organization exists
        const organization = await this.organizationService.getOrganizationProfile(organizationId);
        if (!organization) {
            logger.error('Failed to fetch setup codes - organization not found', { organizationId });
            throw new AppError('Organization not found', 404, 'NOT_FOUND');
        }

        return setupCodeRepository.getSetupCodesByOrganization(organizationId, includeUsed);
    }

    /**
     * Validate and use a setup code
     * 
     * @returns The organization profile associated with the code
     */
    async validateAndUseSetupCode(code: string): Promise<{
        success: boolean;
        organization: OrganizationProfile | null;
        message?: string;
    }> {
        logger.info('Validating setup code', { code });

        const validationResult = await setupCodeRepository.validateSetupCode(code);

        if (!validationResult.valid || !validationResult.setupCode) {
            logger.warn('Setup code validation failed', {
                code,
                reason: validationResult.message
            });

            return {
                success: false,
                organization: null,
                message: validationResult.message
            };
        }

        // Mark the code as used
        await setupCodeRepository.markSetupCodeAsUsed(code);

        // Fetch the organization
        const organization = await this.organizationService.getOrganizationProfile(
            validationResult.setupCode.organization_id
        );

        if (!organization) {
            logger.error('Setup code valid but organization not found', {
                code,
                organizationId: validationResult.setupCode.organization_id
            });

            return {
                success: false,
                organization: null,
                message: 'Organization not found'
            };
        }

        logger.info('Setup code validated and used successfully', {
            code,
            organizationId: organization.id
        });

        return {
            success: true,
            organization
        };
    }

    /**
     * Delete a setup code
     */
    async deleteSetupCode(id: string): Promise<boolean> {
        logger.info('Deleting setup code', { id });
        return setupCodeRepository.deleteSetupCode(id);
    }

    /**
     * Clean up expired setup codes
     */
    async cleanupExpiredCodes(): Promise<number> {
        logger.info('Cleaning up expired setup codes');
        const count = await setupCodeRepository.cleanupExpiredSetupCodes();
        logger.info(`Removed ${count} expired setup codes`);
        return count;
    }
} 