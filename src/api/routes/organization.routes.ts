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
    ListOrganizationProfilesValidator,
    UpdateOrganizationBrandingValidator,
    CompleteOrganizationSetupValidator
} from '../validators/organization.validator';

/**
 * Custom middleware to check for either a valid auth token or a setup code
 * If setup code is present, bypass normal authentication for this route
 */
const authOrSetupCode = (req: any, res: any, next: any) => {
    // If setup code is present, skip normal auth checks
    if (req.setupCode) {
        return next();
    }

    // Otherwise apply normal authentication
    authenticate(req, res, next);
};

export const createOrganizationRoutes = (organizationController: OrganizationController) => {
    const router = Router();

    // Apply the extract setup code middleware to all organization routes
    router.use(extractSetupCode);

    // Create an organization profile - requires setup code or manage_organizations permission
    router.post(
        '/',
        authOrSetupCode,
        authorize('manage_organizations'),
        validateRequest(CreateOrganizationProfileValidator),
        organizationController.createOrganization.bind(organizationController)
    );

    // Get an organization profile by ID - requires setup code or view_all_users permission
    router.get(
        '/:id',
        authOrSetupCode,
        authorize('view_all_users'),
        validateRequest(GetOrganizationProfileValidator),
        organizationController.getOrganization.bind(organizationController)
    );

    // Update an organization profile - requires setup code or manage_organizations permission
    router.put(
        '/:id',
        authOrSetupCode,
        authorize('manage_organizations'),
        validateRequest(UpdateOrganizationProfileValidator),
        organizationController.updateOrganization.bind(organizationController)
    );

    // Update an organization profile using setup code - skip auth if setup code is present
    router.patch(
        '/:id',
        authOrSetupCode,
        authorize('manage_organizations'),
        validateRequest(UpdateOrganizationProfileValidator),
        organizationController.updateOrganization.bind(organizationController)
    );

    // Delete an organization profile - requires setup code or manage_organizations permission
    router.delete(
        '/:id',
        authOrSetupCode,
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

    // Update organization branding - requires setup code or manage_organizations permission
    router.patch(
        '/:id/branding',
        authOrSetupCode,
        authorize('manage_organizations'),
        validateRequest(UpdateOrganizationBrandingValidator),
        organizationController.updateOrganizationBranding.bind(organizationController)
    );

    // Complete organization setup - requires setup code
    router.post(
        '/:id/complete-setup',
        authOrSetupCode,
        authorize('manage_organizations'),
        validateRequest(CompleteOrganizationSetupValidator),
        organizationController.completeOrganizationSetup.bind(organizationController)
    );

    return router;
}; 