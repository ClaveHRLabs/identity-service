import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { SetupCodeController } from '../controllers/setup-code.controller';
import { createOrganizationRoutes } from './organization.routes';
import { createSetupCodeRoutes } from './setup-code.routes';
import { validateRequest } from '../middlewares/validate-request';
import { ListSetupCodesValidator } from '../validators/organization.validator';
import { Config } from '../../config/config';

export const registerRoutes = (
    app: Router,
    organizationController: OrganizationController,
    setupCodeController: SetupCodeController
) => {
    const apiRouter = Router();

    // Register organization routes
    apiRouter.use('/organizations', createOrganizationRoutes(organizationController));

    // Register setup code routes
    apiRouter.use('/setup-codes', createSetupCodeRoutes(setupCodeController));

    // Register the route for getting all setup codes for an organization
    // This is defined here because it uses both organization and setup code routes
    apiRouter.get(
        '/organizations/:organizationId/setup-codes',
        validateRequest(ListSetupCodesValidator),
        setupCodeController.getOrganizationSetupCodes.bind(setupCodeController)
    );

    // Mount all routes under the API prefix
    app.use(Config.API_PREFIX, apiRouter);

    return app;
}; 