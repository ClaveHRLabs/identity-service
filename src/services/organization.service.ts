import { logger } from '../utils/logger';
import * as organizationRepository from '../db/organization';
import * as setupCodeRepository from '../db/setup-code';
import {
    OrganizationProfile,
    CreateOrganizationProfile,
    UpdateOrganizationProfile
} from '../models/schemas/organization';
import { AppError } from '../api/middlewares/error-handler';

export class OrganizationService {
    /**
     * Validate that a setup code is valid and associated with the given organization ID
     * @private
     */
    private async validateSetupCodeForOrganization(
        setupCode: string,
        organizationId: string
    ): Promise<boolean> {
        if (!setupCode) return false;

        try {
            const validationResult = await setupCodeRepository.validateSetupCode(setupCode);

            if (!validationResult.valid || !validationResult.setupCode) {
                return false;
            }

            // Check if the setup code is for this organization
            return validationResult.setupCode.organization_id === organizationId;
        } catch (error) {
            logger.error('Error validating setup code for organization', {
                error: error instanceof Error ? error.message : 'Unknown error',
                setupCode,
                organizationId
            });
            return false;
        }
    }

    /**
     * Create a new organization profile
     */
    async createOrganizationProfile(
        profileData: CreateOrganizationProfile,
        setupCode?: string
    ): Promise<OrganizationProfile> {
        logger.info('Creating new organization profile', {
            name: profileData.name,
            hasSetupCode: !!setupCode
        });

        try {
            const newProfile = await organizationRepository.createOrganizationProfile(profileData);
            logger.info('Organization profile created successfully', {
                id: newProfile.id,
                name: newProfile.name,
                hasSetupCode: !!setupCode
            });
            return newProfile;
        } catch (error) {
            logger.error('Failed to create organization profile', {
                error: error instanceof Error ? error.message : 'Unknown error',
                name: profileData.name,
                hasSetupCode: !!setupCode
            });
            throw error;
        }
    }

    /**
     * Get an organization profile by ID
     */
    async getOrganizationProfile(
        id: string,
        setupCode?: string
    ): Promise<OrganizationProfile | null> {
        logger.debug('Fetching organization profile', {
            id,
            hasSetupCode: !!setupCode
        });
        return organizationRepository.getOrganizationProfileById(id);
    }

    /**
     * Update an organization profile
     */
    async updateOrganizationProfile(
        id: string,
        updateData: UpdateOrganizationProfile,
        setupCode?: string
    ): Promise<OrganizationProfile | null> {
        logger.info('Updating organization profile', {
            id,
            hasSetupCode: !!setupCode
        });

        try {
            // If setup code is provided, validate it for this organization
            if (setupCode) {
                const isValid = await this.validateSetupCodeForOrganization(setupCode, id);
                if (!isValid) {
                    logger.warn('Invalid setup code for organization update', { id, setupCode });
                    throw new AppError('Invalid setup code for this organization', 403, 'FORBIDDEN');
                }
            }

            const updatedProfile = await organizationRepository.updateOrganizationProfile(id, updateData);

            if (updatedProfile) {
                logger.info('Organization profile updated successfully', {
                    id,
                    hasSetupCode: !!setupCode
                });
            } else {
                logger.warn('Organization profile not found for update', {
                    id,
                    hasSetupCode: !!setupCode
                });
            }

            return updatedProfile;
        } catch (error) {
            logger.error('Failed to update organization profile', {
                id,
                error: error instanceof Error ? error.message : 'Unknown error',
                hasSetupCode: !!setupCode
            });
            throw error;
        }
    }

    /**
     * Delete an organization profile
     */
    async deleteOrganizationProfile(
        id: string,
        setupCode?: string
    ): Promise<boolean> {
        logger.info('Deleting organization profile', {
            id,
            hasSetupCode: !!setupCode
        });

        try {
            // If setup code is provided, validate it for this organization
            if (setupCode) {
                const isValid = await this.validateSetupCodeForOrganization(setupCode, id);
                if (!isValid) {
                    logger.warn('Invalid setup code for organization deletion', { id, setupCode });
                    throw new AppError('Invalid setup code for this organization', 403, 'FORBIDDEN');
                }
            }

            const deleted = await organizationRepository.deleteOrganizationProfile(id);

            if (deleted) {
                logger.info('Organization profile deleted successfully', {
                    id,
                    hasSetupCode: !!setupCode
                });
            } else {
                logger.warn('Organization profile not found for deletion', {
                    id,
                    hasSetupCode: !!setupCode
                });
            }

            return deleted;
        } catch (error) {
            logger.error('Failed to delete organization profile', {
                id,
                error: error instanceof Error ? error.message : 'Unknown error',
                hasSetupCode: !!setupCode
            });
            throw error;
        }
    }

    /**
     * Get all organization profiles with optional filtering
     */
    async getOrganizationProfiles(
        filters: { status?: string; subscription_tier?: string } = {},
        limit = 100,
        offset = 0,
        setupCode?: string
    ): Promise<{ profiles: OrganizationProfile[]; total: number }> {
        logger.debug('Fetching organization profiles', {
            filters,
            limit,
            offset,
            hasSetupCode: !!setupCode
        });

        try {
            const [profiles, total] = await Promise.all([
                organizationRepository.getOrganizationProfiles(filters, limit, offset),
                organizationRepository.countOrganizationProfiles(filters)
            ]);

            return { profiles, total };
        } catch (error) {
            logger.error('Failed to fetch organization profiles', {
                error: error instanceof Error ? error.message : 'Unknown error',
                hasSetupCode: !!setupCode
            });
            throw error;
        }
    }
} 