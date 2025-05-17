import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { validateRequest } from '../middlewares/validate-request';
import { extractSetupCode } from '../middlewares/setup-code';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
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

    // Create an organization profile - requires setup code or manage_organizations permission
    router.post(
        '/',
        authenticate,
        authorize('manage_organizations'),
        validateRequest(CreateOrganizationProfileValidator),
        organizationController.createOrganization.bind(organizationController)
    );

    // Get an organization profile by ID - requires view_all_users permission
    router.get(
        '/:id',
        authenticate,
        authorize('view_all_users'),
        validateRequest(GetOrganizationProfileValidator),
        organizationController.getOrganization.bind(organizationController)
    );

    // Update an organization profile - requires manage_organizations permission
    router.put(
        '/:id',
        authenticate,
        authorize('manage_organizations'),
        validateRequest(UpdateOrganizationProfileValidator),
        organizationController.updateOrganization.bind(organizationController)
    );

    // Delete an organization profile - requires manage_organizations permission
    router.delete(
        '/:id',
        authenticate,
        authorize('manage_organizations'),
        validateRequest(DeleteOrganizationProfileValidator),
        organizationController.deleteOrganization.bind(organizationController)
    );

    // List organization profiles with optional filtering - requires view_all_users permission
    router.get(
        '/',
        authenticate,
        authorize('view_all_users'),
        validateRequest(ListOrganizationProfilesValidator),
        organizationController.listOrganizations.bind(organizationController)
    );

    return router;
}; 