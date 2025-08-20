import logger from '../utils/logger';
import * as setupCodeRepository from '../db/setup-code';
import * as organizationRepository from '../db/organization';
import { OrganizationService } from './organization.service';
import {
    OrganizationSetupCode,
    CreateSetupCode,
    OrganizationProfile,
    CreateOrganizationProfile,
} from '../models/schemas/organization';
import { HttpError, HttpStatusCode, CatchErrors, Measure } from '@vspl/core';

export class SetupCodeService {
    private organizationService: OrganizationService;

    constructor(organizationService: OrganizationService) {
        this.organizationService = organizationService;
    }

    /**
     * Create a new setup code for an organization
     * If organization_id is not provided but organization_name is, find or create the organization
     */
    async createSetupCode(
        data: CreateSetupCode & { organization_name?: string },
    ): Promise<OrganizationSetupCode> {

        let organizationId = data.organization_id;
        const organizationName = data.organization_name;

        // If organization ID is not provided but name is, look up the organization by name
        if (!organizationId && organizationName) {
            logger.info('Organization ID not provided, searching by name', {
                organizationName,
            });

            // Check if organization with this name already exists
            const existingOrg =
                await organizationRepository.findOrganizationProfileByName(organizationName);

            if (existingOrg) {
                // Organization exists, use its ID
                logger.info('Found existing organization by name', {
                    organizationName,
                    organizationId: existingOrg.id,
                });
                organizationId = existingOrg.id;
            } else {
                // Organization doesn't exist, create it
                logger.info('Organization not found, creating new one', { organizationName });

                const newOrgData: CreateOrganizationProfile = {
                    name: organizationName,
                    status: 'active',
                    timezone: 'UTC',
                    locale: 'en-US',
                    subscription_tier: 'basic',
                    subscription_status: 'trial',
                };

                const newOrg =
                    await organizationRepository.createOrganizationProfile(newOrgData);
                logger.info('Created new organization', {
                    organizationName: newOrg.name,
                    organizationId: newOrg.id,
                });

                organizationId = newOrg.id;
            }

            // Update the data object with the resolved organization ID
            data.organization_id = organizationId;
        } else if (!organizationId) {
            logger.error('Failed to create setup code - no organization ID or name provided');
            throw new HttpError(
                HttpStatusCode.BAD_REQUEST,
                'Organization ID or name is required',
            );
        }

        // Verify organization exists
        const organization =
            await this.organizationService.getOrganizationProfile(organizationId);
        if (!organization) {
            logger.error('Failed to create setup code - organization not found', {
                organizationId,
            });
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'Organization not found');
        }

        // Create the setup code
        const setupCode = await setupCodeRepository.createSetupCode(data);
        logger.info('Setup code created successfully', {
            id: setupCode.id,
            code: setupCode.code,
            organizationId: setupCode.organization_id,
        });

        return setupCode;
    }

    /**
     * Get setup code by code string
     */
    @CatchErrors()
    async getSetupCode(code: string): Promise<OrganizationSetupCode | null> {
        logger.debug('Fetching setup code', { code });
        return setupCodeRepository.getSetupCodeByCode(code);
    }

    /**
     * Get all setup codes for an organization
     */
    async getSetupCodesByOrganization(
        organizationId: string,
        includeUsed = false,
    ): Promise<OrganizationSetupCode[]> {

        logger.debug('Fetching setup codes for organization', { organizationId, includeUsed });

        // Verify organization exists
        const organization =
            await this.organizationService.getOrganizationProfile(organizationId);
        if (!organization) {
            logger.error('Failed to fetch setup codes - organization not found', {
                organizationId,
            });
            throw new HttpError(HttpStatusCode.NOT_FOUND, 'Organization not found');
        }

        return setupCodeRepository.getSetupCodesByOrganization(organizationId, includeUsed);
    }

    /**
     * Validate and use a setup code
     *
     * @returns The organization profile associated with the code
     */
    @CatchErrors()
    @Measure()
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
                reason: validationResult.message,
            });

            return {
                success: false,
                organization: null,
                message: validationResult.message,
            };
        }

        // Mark the code as used
        await setupCodeRepository.markSetupCodeAsUsed(code);

        // Fetch the organization
        const organization = await this.organizationService.getOrganizationProfile(
            validationResult.setupCode.organization_id,
        );

        if (!organization) {
            logger.error('Setup code valid but organization not found', {
                code,
                organizationId: validationResult.setupCode.organization_id,
            });

            return {
                success: false,
                organization: null,
                message: 'Organization not found',
            };
        }

        logger.info('Setup code validated and used successfully', {
            code,
            organizationId: organization.id,
        });

        return {
            success: true,
            organization,
        };
    }

    /**
     * Delete a setup code
     */
    @CatchErrors()
    @Measure()
    async deleteSetupCode(id: string): Promise<boolean> {
        logger.info('Deleting setup code', { id });
        return setupCodeRepository.deleteSetupCode(id);
    }

    /**
     * Clean up expired setup codes
     */
    @CatchErrors()
    async cleanupExpiredCodes(): Promise<number> {
        logger.info('Cleaning up expired setup codes');
        const count = await setupCodeRepository.cleanupExpiredSetupCodes();
        logger.info(`Removed ${count} expired setup codes`);
        return count;
    }
}
