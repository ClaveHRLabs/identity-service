import { Express } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { SetupCodeController } from '../controllers/setup-code.controller';
import { UserController } from '../controllers/user.controller';
import { AuthController } from '../controllers/auth.controller';
import { createOrganizationRoutes } from './organization.routes';
import { createSetupCodeRoutes } from './setup-code.routes';
import { createUserRoutes } from './user.routes';
import { createAuthRoutes } from './auth.routes';
import { createRoleRoutes } from './role.routes';
import { createApiKeyRoutes } from './api-key.routes';
import { validateRequest } from '../middlewares/validate-request';
import { ListSetupCodesValidator } from '../validators/organization.validator';
import { RoleController } from '../controllers/role.controller';
import { ApiKeyController } from '../controllers/api-key.controller';

export const registerRoutes = (
    app: Express,
    organizationController: OrganizationController,
    setupCodeController: SetupCodeController,
    userController: UserController,
    authController: AuthController,
    roleController: RoleController,
    apiKeyController: ApiKeyController,
    apiPrefix: string = '/api',
) => {
    // Create route handlers
    const organizationRouter = createOrganizationRoutes(organizationController);
    const setupCodeRouter = createSetupCodeRoutes(setupCodeController);
    const userRouter = createUserRoutes(userController);
    const authRouter = createAuthRoutes(authController);
    const roleRouter = createRoleRoutes(roleController);
    const apiKeyRouter = createApiKeyRoutes(apiKeyController);

    // Mount all routes under the API prefix
    app.use(`${apiPrefix}/organizations`, organizationRouter);
    app.use(`${apiPrefix}/setup-codes`, setupCodeRouter);
    app.use(`${apiPrefix}/users`, userRouter);
    app.use(`${apiPrefix}/auth`, authRouter);
    app.use(`${apiPrefix}/roles`, roleRouter);
    app.use(`${apiPrefix}/xkey`, apiKeyRouter);

    // Register the route for getting all setup codes for an organization
    // This is defined here because it uses both organization and setup code routes
    app.get(
        `${apiPrefix}/organizations/:organizationId/setup-codes`,
        validateRequest(ListSetupCodesValidator),
        setupCodeController.getOrganizationSetupCodes.bind(setupCodeController),
    );

    return app;
};
