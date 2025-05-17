import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { validateRequest } from '../middlewares/validate-request';
import { extractSetupCode } from '../middlewares/setup-code';
import {
    CreateOrganizationProfileValidator,
    UpdateOrganizationProfileValidator,
    GetOrganizationProfileValidator,
    DeleteOrganizationProfileValidator,
    ListOrganizationProfilesValidator
} from '../validators/organization.validator';

export const createOrganizationRoutes = (organizationController: OrganizationController) => {
    const router = Router();

    // Apply the extract setup code middleware to all organization routes
    router.use(extractSetupCode);

    // Create an organization profile
    router.post(
        '/',
        validateRequest(CreateOrganizationProfileValidator),
        organizationController.createOrganization.bind(organizationController)
    );

    // Get an organization profile by ID
    router.get(
        '/:id',
        validateRequest(GetOrganizationProfileValidator),
        organizationController.getOrganization.bind(organizationController)
    );

    // Update an organization profile
    router.put(
        '/:id',
        validateRequest(UpdateOrganizationProfileValidator),
        organizationController.updateOrganization.bind(organizationController)
    );

    // Delete an organization profile
    router.delete(
        '/:id',
        validateRequest(DeleteOrganizationProfileValidator),
        organizationController.deleteOrganization.bind(organizationController)
    );

    // List organization profiles with optional filtering
    router.get(
        '/',
        validateRequest(ListOrganizationProfilesValidator),
        organizationController.listOrganizations.bind(organizationController)
    );

    return router;
}; 