import { Express } from 'express';
import { Config } from '../../config/config';
import { OrganizationController } from '../controllers/organization.controller';
import { SetupCodeController } from '../controllers/setup-code.controller';
import { UserController } from '../controllers/user.controller';
import { AuthController } from '../controllers/auth.controller';
import { createOrganizationRoutes } from './organization.routes';
import { createSetupCodeRoutes } from './setup-code.routes';
import { createUserRoutes } from './user.routes';
import { createAuthRoutes } from './auth.routes';
import roleRoutes from './role.routes';
import { validateRequest } from '../middlewares/validate-request';
import { ListSetupCodesValidator } from '../validators/organization.validator';

export const registerRoutes = (
    app: Express,
    organizationController: OrganizationController,
    setupCodeController: SetupCodeController,
    userController: UserController,
    authController: AuthController
) => {
    // Create route handlers
    const organizationRouter = createOrganizationRoutes(organizationController);
    const setupCodeRouter = createSetupCodeRoutes(setupCodeController);
    const userRouter = createUserRoutes(userController);
    const authRouter = createAuthRoutes(authController);

    // Mount all routes under the API prefix
    const apiPrefix = Config.API_PREFIX || '/api';
    app.use(`${apiPrefix}/organizations`, organizationRouter);
    app.use(`${apiPrefix}/setup-codes`, setupCodeRouter);
    app.use(`${apiPrefix}/users`, userRouter);
    app.use(`${apiPrefix}/auth`, authRouter);
    app.use(`${apiPrefix}/roles`, roleRoutes);

    // Register the route for getting all setup codes for an organization
    // This is defined here because it uses both organization and setup code routes
    app.get(
        `${apiPrefix}/organizations/:organizationId/setup-codes`,
        validateRequest(ListSetupCodesValidator),
        setupCodeController.getOrganizationSetupCodes.bind(setupCodeController)
    );

    return app;
}; 