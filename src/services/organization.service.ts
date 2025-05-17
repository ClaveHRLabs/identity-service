import { logger } from '../utils/logger';
import * as organizationRepository from '../db/organization';
import {
    OrganizationProfile,
    CreateOrganizationProfile,
    UpdateOrganizationProfile
} from '../models/schemas/organization';

export class OrganizationService {
    /**
     * Create a new organization profile
     */
    async createOrganizationProfile(profileData: CreateOrganizationProfile): Promise<OrganizationProfile> {
        logger.info('Creating new organization profile', { name: profileData.name });

        try {
            const newProfile = await organizationRepository.createOrganizationProfile(profileData);
            logger.info('Organization profile created successfully', { id: newProfile.id, name: newProfile.name });
            return newProfile;
        } catch (error) {
            logger.error('Failed to create organization profile', {
                error: error instanceof Error ? error.message : 'Unknown error',
                name: profileData.name
            });
            throw error;
        }
    }

    /**
     * Get an organization profile by ID
     */
    async getOrganizationProfile(id: string): Promise<OrganizationProfile | null> {
        logger.debug('Fetching organization profile', { id });
        return organizationRepository.getOrganizationProfileById(id);
    }

    /**
     * Update an organization profile
     */
    async updateOrganizationProfile(
        id: string,
        updateData: UpdateOrganizationProfile
    ): Promise<OrganizationProfile | null> {
        logger.info('Updating organization profile', { id });

        try {
            const updatedProfile = await organizationRepository.updateOrganizationProfile(id, updateData);

            if (updatedProfile) {
                logger.info('Organization profile updated successfully', { id });
            } else {
                logger.warn('Organization profile not found for update', { id });
            }

            return updatedProfile;
        } catch (error) {
            logger.error('Failed to update organization profile', {
                id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Delete an organization profile
     */
    async deleteOrganizationProfile(id: string): Promise<boolean> {
        logger.info('Deleting organization profile', { id });

        try {
            const deleted = await organizationRepository.deleteOrganizationProfile(id);

            if (deleted) {
                logger.info('Organization profile deleted successfully', { id });
            } else {
                logger.warn('Organization profile not found for deletion', { id });
            }

            return deleted;
        } catch (error) {
            logger.error('Failed to delete organization profile', {
                id,
                error: error instanceof Error ? error.message : 'Unknown error'
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
        offset = 0
    ): Promise<{ profiles: OrganizationProfile[]; total: number }> {
        logger.debug('Fetching organization profiles', { filters, limit, offset });

        try {
            const [profiles, total] = await Promise.all([
                organizationRepository.getOrganizationProfiles(filters, limit, offset),
                organizationRepository.countOrganizationProfiles(filters)
            ]);

            return { profiles, total };
        } catch (error) {
            logger.error('Failed to fetch organization profiles', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
} 