import { SetupCodeController } from '../controllers/setup-code.controller';
import { validateRequest } from '../middlewares/validate-request';
import { authenticate } from '../middlewares/auth';
import { addSetupCodeHeader } from '../middlewares/setup-code';
import {
    CreateSetupCodeValidator,
    ValidateSetupCodeValidator,
    DeleteSetupCodeValidator,
} from '../validators/organization.validator';
import { Router } from '@vspl/core';

export const createSetupCodeRoutes = (setupCodeController: SetupCodeController) => {
    const router = Router();

    // Create a new setup code - requires Super Admin or ClaveHR Operator role
    router.post(
        '/',
        authenticate,
        validateRequest(CreateSetupCodeValidator),
        setupCodeController.createSetupCode.bind(setupCodeController),
    );

    // Validate and use a setup code - adds setup code to header
    router.post(
        '/validate',
        validateRequest(ValidateSetupCodeValidator),
        addSetupCodeHeader,
        setupCodeController.validateSetupCode.bind(setupCodeController),
    );

    // Delete a setup code - requires Super Admin or ClaveHR Operator role
    router.delete(
        '/:id',
        authenticate,
        validateRequest(DeleteSetupCodeValidator),
        setupCodeController.deleteSetupCode.bind(setupCodeController),
    );

    // Get all setup codes for an organization (this route is defined separately)

    return router;
};
